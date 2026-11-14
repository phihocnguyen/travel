import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Check, Mic2, Music2, Play, Sparkles, Trophy } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import BlogFooter from "@/components/blog/BlogFooter";
import TravelChatbot from "@/components/chat/TravelChatbot";
import UGCMotion from "@/components/campaign/UGCMotion";
import UGCMarquee from "@/components/campaign/UGCMarquee";
import UGCDemoButton from "@/components/campaign/UGCDemoButton";
import { UGC_EVENT as event } from "@/lib/campaign/ugc";
import "./ugc.css";

export const metadata: Metadata = {
  title: "XOÀI CÓ GU, HÁT CÓ VIBE! · UGC Cover Challenge",
  description: "Cover BỨC TRANH RẠNG NGỜI theo vibe của bạn. Nhận bài 14–17/11/2026, bình chọn đến 12:00 ngày 18/11. Xem thể lệ và tham gia cùng Vị Xoài Dẫn Lối.",
  alternates: { canonical: "/ugc" },
  openGraph: { title: event.name, description: event.tagline, url: "/ugc", images: ["/banner.jpg"] },
};

export default function UGCCoverPage() {
  return <div className="ugc-page">
    <UGCMotion/>
    <SiteHeader active="ugc"/>
    <main>
      <section className="ugc-hero">
        <div className="ugc-wrap ugc-heroGrid">
          <div className="ugc-heroCopy"><span className="ugc-eyebrow"><span/> UGC COVER CHALLENGE · 2026</span><h1>XOÀI CÓ GU,<br/><span>HÁT CÓ VIBE!</span></h1><p className="ugc-tagline">Một bài hát, muôn kiểu cover.<br/>Vibe nào là <em>của bạn?</em></p><p className="ugc-intro">Bạn đã nghe <strong>{event.song}</strong> rồi đúng hong? Giờ thì đến lượt bạn thể hiện ca khúc này theo cách riêng của mình!</p><div className="ugc-actions"><Link href={event.submitHref} className="ugc-button ugc-buttonDark">Tham gia ngay <ArrowUpRight size={19}/></Link><UGCDemoButton/><a href="#the-le" className="ugc-textLink">Khám phá thể lệ <ArrowDown size={16}/></a></div><p className="ugc-loginNote">Đăng nhập vào dashboard để gửi bản cover của bạn.</p></div>
          <div className="ugc-art" aria-hidden="true"><span className="ugc-artNote ugc-noteOne">CỨ HÁT THEO GU BẠN!</span><svg viewBox="0 0 520 520" fill="none"><circle cx="270" cy="270" r="205" fill="#e9bf54"/><circle cx="270" cy="270" r="163" stroke="#fbebac" strokeWidth="2"/><circle cx="270" cy="270" r="141" stroke="#fbebac" strokeWidth="2"/><circle cx="270" cy="270" r="120" stroke="#fbebac" strokeWidth="2"/><path d="M149 360c-42-38-37-98-12-137 30-48 69-45 98-15 42 43 63 103 25 148-30 34-77 35-111 4Z" fill="#f0d16d" stroke="#25493a" strokeWidth="5"/><path d="M177 207q-18-48 28-70-3 43-28 70" fill="#68874d" stroke="#25493a" strokeWidth="4"/><g transform="rotate(28 310 245)"><rect x="264" y="95" width="105" height="167" rx="52" fill="#f6f0d7" stroke="#25493a" strokeWidth="7"/><path d="M264 168h105m-105 25h105m-100 25h95m-84-96v138m26-155v157m26-153v150" stroke="#25493a" strokeWidth="4"/><path d="M249 218v12a67 67 0 0 0 134 0v-12m-67 80v94m-44 0h88" stroke="#25493a" strokeWidth="9" strokeLinecap="round"/></g><path d="m82 133 13 27 30 4-22 22 5 30-27-14-27 14 5-30-22-22 30-4Z" fill="#ed9c87" stroke="#25493a" strokeWidth="4"/><path d="m416 315 9 17 19 3-14 14 4 20-18-9-18 9 4-20-14-14 19-3Z" fill="#ed9c87" stroke="#25493a" strokeWidth="4"/><path d="M99 297v-46l31-8v45" stroke="#25493a" strokeWidth="6"/><ellipse cx="89" cy="299" rx="14" ry="10" fill="#25493a"/><ellipse cx="120" cy="289" rx="14" ry="10" fill="#25493a"/></svg><span className="ugc-artNote ugc-noteTwo"><Music2 size={15}/> BỨC TRANH RẠNG NGỜI</span><span className="ugc-vinylLabel">YOUR VOICE.<br/>YOUR VIBE.</span></div>
        </div>
        <UGCMarquee/>
      </section>
      <section className="ugc-wrap ugc-section" aria-labelledby="ugc-about"><div className="ugc-sectionHeading"><span className="ugc-eyebrow">01 / MỘT SÂN CHƠI, MUÔN CÁ TÍNH</span><h2 id="ugc-about">Không cần hoàn hảo.<br/>Chỉ cần <em>là bạn.</em></h2></div><div className="ugc-about"><p>{event.description}</p><p>Không cần hát thật chuyên nghiệp hay đầu tư một video cầu kỳ. Chỉ cần chọn đoạn nhạc yêu thích, bật camera và cho tụi mình nghe vibe của bạn nha!</p><div className="ugc-chips"><span><Mic2 size={15}/> Không cần chuyên nghiệp</span><span><Music2 size={15}/> Không giới hạn thời lượng</span><span><Sparkles size={15}/> Tự do thể hiện</span></div></div></section>
      <section className="ugc-timelineBand" aria-label="Thời gian diễn ra"><div className="ugc-wrap"><div className="ugc-timelineIntro"><span className="ugc-eyebrow">LƯU LỊCH NÀY NHA!</span><p>Từ chiếc mic của bạn<br/>đến những lượt yêu thương.</p></div><ol className="ugc-timeline">{event.timeline.map((item,index)=><li key={item.label}><span className="ugc-timelineIndex">0{index+1}</span><span>{item.label}</span><strong>{item.iso?<time dateTime={item.iso}>{item.date}</time>:item.date}</strong><small>{item.time}</small></li>)}</ol><p className="ugc-timezone">Các mốc thời gian theo giờ Việt Nam (GMT+7).</p></div></section>
      <section id="cach-tham-gia" className="ugc-wrap ugc-section ugc-stepsSection"><div className="ugc-sectionHeading"><span className="ugc-eyebrow">02 / BẬT MIC, LÊN VIBE</span><h2>5 bước để<br/><em>vibe của bạn</em> lên sóng.</h2><Link href={event.submitHref} className="ugc-button ugc-buttonDark">Vào dashboard tham gia <ArrowUpRight size={18}/></Link><p className="ugc-asideNote">Không bắt buộc đăng TikTok hay Facebook. Gửi bài trên website là được nha!</p></div><ol className="ugc-steps">{event.steps.map((step,index)=><li key={step.title}><span>0{index+1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}</ol></section>
      <section id="the-le" className="ugc-rulesBand"><div className="ugc-wrap ugc-rulesGrid"><div><span className="ugc-eyebrow">03 / MỘT PHIẾU, MỘT VIBE YÊU THÍCH</span><h2>Bình chọn<br/><em>bằng yêu thương.</em></h2><div className="ugc-oneVote"><strong>01</strong><p>người · 01 phiếu<br/>cho 01 bản cover<br/><b>trong toàn bộ cuộc thi</b></p></div></div><ol className="ugc-rules">{event.votingRules.map(rule=><li key={rule}><Check size={17}/><p>{rule}</p></li>)}</ol></div></section>
      <section className="ugc-wrap ugc-prizeSection"><div className="ugc-prizeIcon"><Trophy size={72} strokeWidth={1.2}/><span>THE MOST LOVED COVER</span></div><div><span className="ugc-eyebrow">04 / DÀNH CHO VIBE ĐƯỢC YÊU NHẤT</span><h2>Giải {event.prize.title}</h2><p>{event.prize.description}</p><span className="ugc-prizeNote">🎁 {event.prize.gift}</span></div></section>
      <section className="ugc-wrap ugc-notesSection"><span className="ugc-eyebrow">05 / TRƯỚC KHI GỬI BÀI</span><h2>Một chút lưu ý,<br/>để cuộc chơi <em>trọn vibe.</em></h2><div className="ugc-notes">{event.notes.map((note,index)=><div key={note}><span>0{index+1}</span><p>{note}</p></div>)}</div></section>
      <section id="faq" className="ugc-wrap ugc-section ugc-faqSection"><div className="ugc-sectionHeading"><span className="ugc-eyebrow">06 / HỎI NHỎ, ĐÁP LIỀN</span><h2>Bạn hỏi,<br/><em>tụi mình nghe.</em></h2><p className="ugc-asideNote">Còn băn khoăn? Hỏi Xoài ở góc màn hình để tìm hiểu thêm về hoạt động nhé.</p></div><div className="ugc-faq">{event.faq.map(item=><details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div></section>
      <section className="ugc-final"><div className="ugc-wrap"><span className="ugc-eyebrow">MỘT GIAI ĐIỆU QUEN. MỘT PHIÊN BẢN RẤT BẠN.</span><h2>Vậy bản cover của bạn<br/>sẽ mang <em>vibe gì?</em></h2><p>Cùng bật mic và cho tụi mình nghe nha! 🥭💛</p><div className="ugc-actions"><Link href={event.submitHref} className="ugc-button ugc-buttonYellow"><Mic2 size={18}/> Tham gia ngay <ArrowUpRight size={18}/></Link><Link href={event.videosHref} className="ugc-button ugc-buttonOutline"><Play size={16}/> Xem các bản cover</Link></div><p className="ugc-hashtags">{event.hashtags.join(" ")}</p><span className="ugc-signoff">VỊ XOÀI DẪN LỐI · Theo vị Xoài Cát, mở lối chu du.</span></div></section>
    </main><BlogFooter/><TravelChatbot/>
  </div>;
}
