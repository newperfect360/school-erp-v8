package com.gbsschool.app.feature.auth

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.print.PrintManager
import android.webkit.*
import android.util.Base64
import android.os.Handler
import android.os.Looper
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView

class DemoFileBridge(
 private val saveAction:(String,String)->Unit,
 private val printAction:(String)->Unit
){
 @JavascriptInterface fun save(name:String,encoded:String)=saveAction(name,encoded)
 @JavascriptInterface fun printDocument(html:String)=printAction(html)
}

private fun attachFiles(view:WebView,bridge:DemoFileBridge){
 view.addJavascriptInterface(bridge,"SchoolDemoFiles")
}

/** Debug-only host for the existing Web app; all records stay on the same server. */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun DemoWebWorkspace(emulator:Boolean,onBack:()->Unit){
 val context=LocalContext.current
 val base=if(emulator)"http://10.0.2.2:5178" else "http://127.0.0.1:5178"
 var message by remember { mutableStateOf("") }
 var upload by remember { mutableStateOf<ValueCallback<Array<Uri>>?>(null) }
 var pendingFile by remember { mutableStateOf<ByteArray?>(null) }
 var web by remember { mutableStateOf<WebView?>(null) }
 val picker=rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()){result->upload?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result.resultCode,result.data));upload=null}
 val saveFile=rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/octet-stream")){uri->
  val bytes=pendingFile;pendingFile=null
  if(uri!=null&&bytes!=null)try{context.contentResolver.openOutputStream(uri)?.use{it.write(bytes)};message="File saved."}catch(_:Exception){message="File could not be saved. Try again."}
 }
 val main=remember { Handler(Looper.getMainLooper()) }
 val printViews=remember { mutableListOf<WebView>() }
 val bridge:DemoFileBridge=remember {
  DemoFileBridge(saveAction={name,encoded->main.post {
    try{require(encoded.length<=40*1024*1024);pendingFile=Base64.decode(encoded,Base64.DEFAULT);saveFile.launch(name.substringAfterLast('/').substringAfterLast('\\').take(120).ifBlank{"school-export.html"})}catch(_:Exception){message="Export exceeds the supported size or could not be read."}
   }},printAction={html->main.post {
    if(html.length>30*1024*1024){message="Document is too large to print.";return@post}
    val printView=WebView(context);printViews.add(printView)
    printView.settings.javaScriptEnabled=false;printView.settings.allowFileAccess=false;printView.settings.allowContentAccess=false;printView.settings.blockNetworkLoads=true
    printView.webViewClient=object:WebViewClient(){override fun onPageFinished(view:WebView,url:String){
     try{val manager=context.getSystemService(android.content.Context.PRINT_SERVICE) as PrintManager;manager.print("School document",view.createPrintDocumentAdapter("School document"),null)}catch(_:Exception){message="Android printing is not available on this device."}
    }}
    printView.loadDataWithBaseURL(null,html,"text/html","UTF-8",null)
   }})
 }
 DisposableEffect(Unit){onDispose {upload?.onReceiveValue(null);web?.removeJavascriptInterface("SchoolDemoFiles");web?.destroy();printViews.forEach{it.destroy()};main.removeCallbacksAndMessages(null)}}
 Column(Modifier.fillMaxSize()){
  Row(Modifier.fillMaxWidth().padding(8.dp),horizontalArrangement=Arrangement.SpaceBetween){TextButton(onClick=onBack){Text("Native modules")};Text("DEVELOPMENT / TEST MODE")}
  Text("Full Web workspace · same demo accounts and records. Sign in here with your demo account.",Modifier.padding(horizontal=12.dp))
  if(message.isNotBlank())Text(message,Modifier.padding(12.dp))
  AndroidView(modifier=Modifier.weight(1f).fillMaxWidth(),factory={
   WebView(context).apply {
    web=this
    settings.javaScriptEnabled=true;settings.domStorageEnabled=true;settings.allowFileAccess=false;settings.allowContentAccess=true
    settings.mixedContentMode=WebSettings.MIXED_CONTENT_NEVER_ALLOW
    attachFiles(this,bridge)
    webChromeClient=object:WebChromeClient(){override fun onShowFileChooser(view:WebView,callback:ValueCallback<Array<Uri>>,params:FileChooserParams):Boolean{
     upload?.onReceiveValue(null);upload=callback
     return try{picker.launch(Intent(Intent.ACTION_OPEN_DOCUMENT).apply{type="*/*";addCategory(Intent.CATEGORY_OPENABLE);putExtra(Intent.EXTRA_ALLOW_MULTIPLE,true)});true}catch(_:Exception){upload?.onReceiveValue(null);upload=null;message="No file picker is available.";false}
    }}
    webViewClient=object:WebViewClient(){
     override fun shouldOverrideUrlLoading(view:WebView,request:WebResourceRequest):Boolean{
      val uri=request.url
      if(uri.scheme=="http"&&uri.host in listOf("127.0.0.1","10.0.2.2")&&uri.port==5178)return false
      if(uri.scheme=="about"||uri.scheme=="blob")return false
      if(uri.scheme in listOf("tel","sms","smsto","mailto")||(uri.scheme=="https"&&uri.host in listOf("wa.me","api.whatsapp.com"))){
       try{context.startActivity(Intent(if(uri.scheme=="tel")Intent.ACTION_DIAL else Intent.ACTION_VIEW,uri))}catch(_:Exception){message="No compatible phone or messaging application is installed."}
      }else message="This demo workspace only opens the local school application."
      return true
     }
     override fun onReceivedError(view:WebView,request:WebResourceRequest,error:WebResourceError){if(request.isForMainFrame)message="Cannot reach the demo server. Keep Web running and connect USB with adb reverse tcp:5178 tcp:5178."}
     override fun onPageFinished(view:WebView,url:String){
      if(!url.startsWith(base+"/"))return
      view.evaluateJavascript("""
       (()=>{
        const wire=w=>{try{w.print=()=>SchoolDemoFiles.printDocument(w.document.documentElement.outerHTML)}catch(e){}};
        wire(window);const frames=()=>document.querySelectorAll('iframe').forEach(f=>{wire(f.contentWindow);if(!f.dataset.demoPrint){f.dataset.demoPrint='1';f.addEventListener('load',()=>wire(f.contentWindow))}});
        frames();new MutationObserver(frames).observe(document.body,{childList:true,subtree:true});
        const save=async a=>{const bytes=new Uint8Array(await(await fetch(a.href)).arrayBuffer());let value='';for(let i=0;i<bytes.length;i+=8192)value+=String.fromCharCode(...bytes.subarray(i,i+8192));SchoolDemoFiles.save(a.download||'school-export',btoa(value))};
        const click=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download&&this.href.startsWith('blob:')){save(this);return}return click.call(this)};
        document.addEventListener('click',e=>{const a=e.target.closest('a[download]');if(!a||!a.href.startsWith('blob:'))return;e.preventDefault();save(a)},true);
       })()
      """.trimIndent(),null)
     }
    }
    loadUrl(base+"/")
   }
  })
 }
}
