"use client";

import { X } from "lucide-react";

const FRUITS = [
  { left: "28%", top: "35%" },
  { left: "61%", top: "31%" },
  { left: "47%", top: "52%" },
] as const;

type Props = {
  picked: number[];
  onPick: (index: number) => void;
  onClose: () => void;
};

export default function MangoHarvestDialog({ picked, onPick, onClose }: Props) {
  return (
    <div className="ex-mangoBackdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="ex-mangoCard" role="dialog" aria-modal="true" aria-labelledby="ex-mangoTitle">
        <button className="ex-mangoClose" onClick={onClose} aria-label="Đóng trò hái xoài" autoFocus><X size={18} /></button>
        <span className="ex-mangoKicker">VƯỜN XOÀI CAO LÃNH · MINI GAME</span>
        <h2 id="ex-mangoTitle">Hái xoài trên cây</h2>
        <p>Chạm vào từng trái xoài chín để hái xuống giỏ.</p>
        <div className="ex-mangoScene">
          <svg className="ex-mangoTree" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <path fill="#a9cf89" d="M0 0h400v320H0z" />
            <path fill="#8dbb78" d="M0 252h400v68H0z" />
            <path fill="#6b9d61" d="M0 278h400v42H0z" />
            <path fill="#6f4d34" d="M178 139h45v143h-45zM146 159h30v22h58v-22h27v34h-38v24h-45v-27h-32z" />
            <path fill="#a67849" d="M189 164h13v116h-13zM154 166h45v9h-45z" />
            <path fill="#315f38" d="M122 37h154v22h43v25h25v72h-31v25h-72v17h-105v-18H84v-29H57V91h30V61h35z" />
            <path fill="#427a43" d="M121 47h141v22h47v22h21v56h-35v26h-58v17h-93v-17H98v-29H72V95h28V68h21z" />
            <path fill="#63994f" d="M129 52h94v18h45v18h31v21h-58v18H99V92h31zM79 117h70v21h-25v27H91v-26H79z" />
            <path fill="#85aa58" d="M139 58h68v14h-68zM114 83h53v16h-53zM242 92h45v16h-45zM101 130h33v17h-33z" />
            <path fill="#315f38" d="M11 292h53v7H11zM284 295h65v8h-65zM365 277h23v8h-23z" />
          </svg>
          {FRUITS.map((fruit, index) => (
            <button key={index} type="button" className={`ex-mangoFruit ${picked.includes(index) ? "ex-mangoFruitPicked" : ""}`}
              style={fruit} disabled={picked.includes(index)} onClick={() => onPick(index)}
              aria-label={`Hái trái xoài ${index + 1}`}>
              <svg viewBox="0 0 40 48" aria-hidden="true">
                <path fill="#315f38" d="M18 0h5v9h-5zM21 5h12v5h-5v5h-7z" />
                <path fill="#926638" d="M17 8h5v6h-5z" />
                <path fill="#c47a28" d="M10 13h22v5h5v17h-5v6H13v-5H7V21h3z" />
                <path fill="#f1b941" d="M12 13h16v5h5v16h-5v5H14v-5H9V22h3z" />
                <path fill="#ffdc68" d="M13 18h8v5h-8zM10 23h6v9h-6z" />
              </svg>
            </button>
          ))}
          <div className="ex-mangoBasket" aria-label={`Giỏ có ${picked.length} trên 3 trái xoài`}>
            <span>GIỎ XOÀI</span><strong>{picked.length}/3</strong>
            <div aria-hidden="true">{Array.from({ length: picked.length }, (_, index) => <i key={index} />)}</div>
          </div>
        </div>
        <div className="ex-mangoFooter">
          <span role="status">{picked.length === 3 ? "Giỏ xoài đã đầy rồi!" : `Đã hái ${picked.length}/3 trái`}</span>
          <button type="button" onClick={onClose}>{picked.length === 3 ? "Hoàn thành" : "Quay lại vườn"}</button>
        </div>
      </section>
    </div>
  );
}
