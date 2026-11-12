"use client";

import { X } from "lucide-react";

const STEPS = ["Trải lá chuối", "Thêm nếp và nhân", "Gấp lá, buộc lạt"] as const;

type Props = {
  step: number;
  onAdvance: () => void;
  onClose: () => void;
};

export default function CakeWrappingDialog({ step, onAdvance, onClose }: Props) {
  return (
    <div className="ex-mangoBackdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="ex-mangoCard ex-cakeCard" role="dialog" aria-modal="true" aria-labelledby="ex-cakeTitle">
        <button className="ex-mangoClose" onClick={onClose} aria-label="Đóng trò gói bánh" autoFocus><X size={18} /></button>
        <span className="ex-mangoKicker">CHỢ QUÊ TÂN THUẬN ĐÔNG · MINI GAME</span>
        <h2 id="ex-cakeTitle">Gói bánh quê</h2>
        <p>Làm lần lượt ba công đoạn để hoàn thành chiếc bánh.</p>
        <div className="ex-cakeScene" aria-label={`Chiếc bánh đang ở công đoạn ${step} trên 3`}>
          <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <path fill="#c39a6d" d="M0 0h400v250H0z" />
            <path fill="#ae8156" d="M0 31h400v9H0zM0 112h400v9H0zM0 202h400v9H0z" />
            <path fill="#e3cba0" d="M85 20h235v215H85z" />
            <path fill="#c69e67" d="M95 30h215v195H95z" />
            {step === 0 && <>
              <path fill="#407446" d="M117 139h72v17h-72zM127 115h55v25h-55zM224 87h54v17h-54zM211 105h71v29h-71z" />
              <path fill="#6b9f5b" d="M123 121h56v15h-56zM216 109h62v19h-62z" />
              <path fill="#f7e8c2" d="M170 177h55v18h-55z" />
              <path fill="#dcbf73" d="M177 182h23v8h-23z" />
            </>}
            {step >= 1 && step < 3 && <>
              <path fill="#315e3c" d="M200 51h23v19h25v23h24v42h-21v30h-27v23h-47v-22h-29v-32h-20V94h22V72h28V52z" />
              <path fill="#4f884b" d="M183 62h34v20h29v21h17v28h-23v27h-24v21h-32v-22h-29v-29h-18v-23h24V83h22z" />
              <path fill="#78a962" d="M184 74h20v88h-20zM163 102h78v16h-78z" />
            </>}
            {step === 2 && <>
              <path fill="#f7e9ca" d="M165 100h72v47h-72z" />
              <path fill="#e4cd9f" d="M170 108h63v30h-63z" />
              <path fill="#dfb658" d="M188 111h27v22h-27z" />
              <path fill="#b47f46" d="M195 117h13v10h-13z" />
            </>}
            {step === 3 && <>
              <path fill="#315e3c" d="M161 69h78v16h17v18h17v70h-18v17h-19v16h-73v-17h-19v-20h-16v-69h18V84h15z" />
              <path fill="#4c854b" d="M164 79h71v18h17v17h14v52h-16v17h-17v14h-66v-16h-17v-20h-13v-47h15V97h12z" />
              <path fill="#78a65e" d="M166 87h53v14h-53zM148 111h20v48h-20z" />
              <path fill="#d2b46b" d="M195 80h12v112h-12zM145 129h119v11H145z" />
              <path fill="#a27c4b" d="M195 129h12v11h-12z" />
            </>}
          </svg>
          <span className="ex-cakeSceneLabel">{step === 0 ? "Lá, nếp và nhân đã sẵn sàng" : step === 3 ? "Bánh đã gói xong!" : STEPS[step - 1] + " ✓"}</span>
        </div>
        <div className="ex-cakeSteps">
          {STEPS.map((label, index) => <button key={label} type="button" onClick={onAdvance} disabled={index !== step}
            className={index < step ? "ex-cakeStepDone" : index === step ? "ex-cakeStepActive" : ""}>
            <b>{index < step ? "✓" : index + 1}</b><span>{label}</span>
          </button>)}
        </div>
        <div className="ex-mangoFooter"><span role="status">{step === 3 ? "Mẻ bánh đã sẵn sàng!" : `Đã làm ${step}/3 công đoạn`}</span><button type="button" onClick={onClose}>{step === 3 ? "Hoàn thành" : "Quay lại chợ"}</button></div>
      </section>
    </div>
  );
}
