import { Component, useEffect, useState } from 'react';
import Icon from './Icon';

export function notify(message) {
  const type = /नाही|चुकी|भरा|तपासा|wrong|failed/i.test(message) ? 'error' : /save|जतन|यशस्वी/i.test(message) ? 'success' : 'info';
  window.dispatchEvent(new CustomEvent('erp-feedback', { detail: { message, type, id: Date.now() } }));
}

export default function Feedback() {
  const [notice, setNotice] = useState(null);
  useEffect(() => {
    let timer;
    const show = event => { setNotice(event.detail); clearTimeout(timer); timer = setTimeout(() => setNotice(null), 6500); };
    window.addEventListener('erp-feedback', show);
    return () => { window.removeEventListener('erp-feedback', show); clearTimeout(timer); };
  }, []);
  return notice && <div className={`toast toast-${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}><span className="toast-icon"><Icon name={notice.type === 'success' ? 'check' : 'bell'} /></span><p>{notice.message}</p><button className="icon-button" onClick={() => setNotice(null)} aria-label="सूचना बंद करा"><Icon name="close" size={16} /></button></div>;
}

export class PageBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div className="empty-state error-state" role="alert"><Icon name="file" size={32} /><h2>हे पान उघडता आले नाही</h2><p>जतन केलेला डेटा बदललेला नाही. पुन्हा प्रयत्न करा.</p><button onClick={() => this.setState({ failed: false })}>पुन्हा प्रयत्न करा</button></div>;
    return this.props.children;
  }
}
