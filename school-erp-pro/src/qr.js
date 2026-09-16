import qrcode from 'qrcode-generator';

qrcode.stringToBytes = value => Array.from(new TextEncoder().encode(value));

export function qrImage(text) {
  try {
    const code = qrcode(0, 'M');
    code.addData(text);
    code.make();
    return code.createDataURL(4, 16);
  } catch {
    return undefined;
  }
}
