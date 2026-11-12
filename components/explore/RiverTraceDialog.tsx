"use client";

import { X } from "lucide-react";

const CLUES = [
  { name: "Hầm chữ A", hint: "Nấp dưới tán tràm", left: "23%", top: "39%" },
  { name: "Hầm bí mật chữ L", hint: "Tìm nơi bờ đất khuất", left: "53%", top: "54%" },
  { name: "Công sự chữ Z", hint: "Quan sát mé rừng", left: "78%", top: "35%" },
] as const;

type Props = { found: number[]; onFind: (index: number) => void; onClose: () => void };

export default function RiverTraceDialog({ found, onFind, onClose }: Props) {
  const nextClue = CLUES.findIndex((_, index) => !found.includes(index));
  return (
    <div className="ex-mangoBackdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="ex-mangoCard ex-riverCard" role="dialog" aria-modal="true" aria-labelledby="ex-riverTitle">
        <button className="ex-mangoClose" onClick={onClose} aria-label="Đóng trò tìm dấu tích" autoFocus><X size={18} /></button>
        <span className="ex-mangoKicker">XẺO QUÝT · THEO DẤU CĂN CỨ VEN LẠCH</span>
        <h2 id="ex-riverTitle">Ngồi xuồng, tìm dấu tích</h2>
        <p>Nhìn từ mặt lạch và chạm vào dấu tích ẩn trong rừng tràm.</p>
        <div className="ex-riverScene">
          <svg viewBox="0 0 480 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <path fill="#a9c77c" d="M0 0h480v250H0z" />
            <path fill="#315c3c" d="M0 0h480v63H0zM0 75h480v29H0zM0 118h480v27H0z" />
            <path fill="#477747" d="M0 17h480v18H0zM0 82h480v13H0zM0 125h480v12H0z" />
            <path fill="#6d9650" d="M14 0h22v105H14zM65 0h14v94H65zM133 0h20v101h-20zM208 0h17v95h-17zM296 0h22v107h-22zM380 0h16v99h-16zM445 0h21v105h-21z" />
            <path fill="#5c452f" d="M41 62h69v9H41zM252 90h92v9h-92zM355 55h73v9h-73z" />
            <path fill="#62aeb0" d="M0 150h480v100H0z" />
            <path fill="#75c0b7" d="M0 161h480v9H0zM0 198h480v7H0zM0 227h480v8H0z" />
            <path fill="#417f83" d="M0 180h480v5H0zM0 215h480v5H0z" />
            <path fill="#315e3c" d="M31 111h51v8H31zM378 110h64v8h-64z" />
            <path fill="#6f5035" d="M190 193h100v21h-100zM176 205h128v13H176z" />
            <path fill="#a47a4d" d="M205 184h69v11h-69zM221 175h38v9h-38z" />
            <path fill="#d5b66c" d="M236 174h8v-18h8v18z" />
          </svg>
          {CLUES.map((clue, index) => {
            const isFound = found.includes(index);
            return <button key={clue.name} type="button" className={`ex-riverClue ${isFound ? "ex-riverClueFound" : ""}`}
              style={{ left: clue.left, top: clue.top }} disabled={isFound} onClick={() => onFind(index)}
              aria-label={isFound ? `${clue.name}, đã tìm thấy` : `Tìm ${clue.name}: ${clue.hint}`}>
              <span aria-hidden="true">{index === 0 ? "⌂" : index === 1 ? "⌜" : "⌁"}</span>
              {isFound && <b>{clue.name}</b>}
            </button>;
          })}
          <div className="ex-riverBoat" aria-hidden="true"><span>●</span><i /><b>◉</b></div>
          <span className="ex-riverSceneLabel">{found.length === 3 ? "Đã lần theo hết các dấu tích" : "Lạch nhỏ len giữa rừng tràm"}</span>
        </div>
        <div className="ex-riverClueList" aria-label="Dấu tích đã tìm">
          {CLUES.map((clue, index) => <div key={clue.name} className={found.includes(index) ? "ex-riverListFound" : ""}>
            <b>{found.includes(index) ? "✓" : "?"}</b><span><strong>{found.includes(index) ? clue.name : "Dấu tích ven lạch"}</strong><small>{found.includes(index) ? "Đã ghi vào sổ" : clue.hint}</small></span>
          </div>)}
        </div>
        <div className="ex-mangoFooter"><span role="status">{found.length === 3 ? "Đã khám phá đủ ba dấu tích!" : `Đã tìm ${found.length}/3 dấu tích`}</span><button type="button" onClick={onClose}>{found.length === 3 ? "Hoàn thành" : nextClue < 0 ? "Đóng" : "Tiếp tục tìm"}</button></div>
      </section>
    </div>
  );
}
