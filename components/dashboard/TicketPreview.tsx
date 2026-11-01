import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  Ref,
} from "react";
import type { TicketDesign } from "@/lib/tickets/types";

export const VOUCHER_TEMPLATE = "/voucher-template.jpg";

type Props = {
  design: TicketDesign;
  className?: string;
  rootRef?: Ref<HTMLDivElement>;
  selectedStickerId?: string | null;
  onBackgroundClick?: () => void;
  onStickerPointerDown?: (
    event: ReactPointerEvent<HTMLSpanElement>,
    stickerId: string,
  ) => void;
  onPointerMove?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onImagePointerDown?: (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => void;
};

function PhotoFrame({
  design,
  onPointerDown,
}: {
  design: TicketDesign;
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  const { image, theme } = design;
  const interactive = Boolean(onPointerDown);

  return (
    <div
      onPointerDown={onPointerDown}
      className={`relative h-full w-full overflow-hidden rounded-[1.3cqw] ${
        interactive ? "cursor-move touch-none" : ""
      }`}
      style={{
        background: `linear-gradient(140deg, ${theme.accent} 0%, ${theme.ink} 100%)`,
        boxShadow: `0 0 0 0.28cqw ${theme.background}, 0 0 0 0.5cqw ${theme.accent}`,
      }}
    >
      {image.url ? (
        <div
          className="absolute inset-0 bg-no-repeat"
          style={{
            backgroundImage: `url(${image.url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: `translate(${image.x}%, ${image.y}%) scale(${image.scale})`,
          }}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[1.4cqw] text-center">
          <span
            className="font-display tracking-[0.3em] opacity-85"
            style={{ fontSize: "3.2cqw", color: theme.background }}
          >
            ĐỒNG THÁP
          </span>
          <span
            className="uppercase tracking-[0.28em] opacity-55"
            style={{ fontSize: "1.25cqw", color: theme.background }}
          >
            Ảnh kỷ niệm
          </span>
        </div>
      )}
    </div>
  );
}

function FromTo({
  design,
  centered = false,
}: {
  design: TicketDesign;
  centered?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-[3%] font-semibold uppercase ${
        centered ? "justify-center text-center" : "justify-between"
      }`}
      style={{
        color: design.theme.accent,
        fontSize: "1.2cqw",
        letterSpacing: "0.2em",
      }}
    >
      <span className="truncate">{design.from}</span>
      <span aria-hidden="true">→</span>
      <span className="truncate">{design.to}</span>
    </div>
  );
}

function TextCard({
  design,
  variant = "panel",
}: {
  design: TicketDesign;
  variant?: "panel" | "overlay";
}) {
  const overlay = variant === "overlay";

  return (
    <div
      className={`flex min-h-0 flex-col justify-between rounded-[1.3cqw] ${
        overlay
          ? "w-[74%] p-[3.2%] shadow-2xl backdrop-blur-sm"
          : "h-full p-[4.5%] shadow-sm"
      }`}
      style={{
        backgroundColor: `${design.theme.background}${overlay ? "f2" : "ff"}`,
        color: design.theme.ink,
        boxShadow: `inset 0 0 0 0.16cqw ${design.theme.accent}33`,
      }}
    >
      <FromTo design={design} />

      <div className="min-h-0">
        <h3
          className="font-display leading-[1.05] tracking-tight break-words"
          style={{ fontSize: overlay ? "3.4cqw" : "3.2cqw" }}
        >
          {design.title}
        </h3>
        <p
          className={`mt-[1.2cqw] whitespace-pre-line leading-[1.45] opacity-80 ${
            overlay ? "line-clamp-2" : "line-clamp-4"
          }`}
          style={{ fontSize: "1.55cqw" }}
        >
          {design.message}
        </p>
      </div>

      <div className="flex items-center gap-[2%]">
        <span
          className="h-[0.3cqw] flex-1 rounded-full"
          style={{ backgroundColor: design.theme.accent }}
        />
        <span
          className="uppercase opacity-55"
          style={{ fontSize: "1.05cqw", letterSpacing: "0.24em" }}
        >
          Dong Thap
        </span>
      </div>
    </div>
  );
}

function LeftLayout({
  design,
  onImagePointerDown,
}: {
  design: TicketDesign;
  onImagePointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div className="grid h-full grid-cols-[43%_1fr] gap-[4%]">
      <PhotoFrame design={design} onPointerDown={onImagePointerDown} />
      <TextCard design={design} />
    </div>
  );
}

function RightLayout({
  design,
  onImagePointerDown,
}: {
  design: TicketDesign;
  onImagePointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div className="grid h-full grid-cols-[1fr_43%] gap-[4%]">
      <TextCard design={design} />
      <PhotoFrame design={design} onPointerDown={onImagePointerDown} />
    </div>
  );
}

function FullLayout({
  design,
  onImagePointerDown,
}: {
  design: TicketDesign;
  onImagePointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0">
        <PhotoFrame design={design} onPointerDown={onImagePointerDown} />
      </div>

      <div
        className="absolute inset-0 rounded-[1.3cqw]"
        style={{
          background: `linear-gradient(180deg, ${design.theme.ink}00 25%, ${design.theme.ink}99 100%)`,
        }}
      />

      <div className="absolute bottom-[4%] left-[4%]">
        <TextCard design={design} variant="overlay" />
      </div>
    </div>
  );
}

export default function TicketPreview({
  design,
  className = "",
  rootRef,
  selectedStickerId = null,
  onBackgroundClick,
  onStickerPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onImagePointerDown,
}: Props) {
  const interactive = Boolean(onStickerPointerDown);
  const rootStyle = {
    containerType: "inline-size",
    backgroundColor: "#000000",
    backgroundImage: `url(${VOUCHER_TEMPLATE})`,
    backgroundSize: "100% 100%",
    backgroundRepeat: "no-repeat",
    color: design.theme.ink,
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      onClick={onBackgroundClick}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={rootStyle}
      className={`relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-y-[19%] left-[37.5%] right-[8.5%]">
        {design.layout === "full" ? (
          <FullLayout
            design={design}
            onImagePointerDown={onImagePointerDown}
          />
        ) : design.layout === "right" ? (
          <RightLayout
            design={design}
            onImagePointerDown={onImagePointerDown}
          />
        ) : (
          <LeftLayout
            design={design}
            onImagePointerDown={onImagePointerDown}
          />
        )}
      </div>

      {design.stickers.map((sticker) => (
        <span
          key={sticker.id}
          onPointerDown={(event) => onStickerPointerDown?.(event, sticker.id)}
          onClick={(event) => event.stopPropagation()}
          className={`absolute z-20 leading-none select-none ${
            interactive ? "cursor-grab touch-none active:cursor-grabbing" : ""
          } ${
            selectedStickerId === sticker.id
              ? "rounded-[0.4cqw] outline outline-[0.3cqw] outline-offset-[0.3cqw] outline-dashed outline-white/90"
              : ""
          }`}
          style={{
            left: `${sticker.x}%`,
            top: `${sticker.y}%`,
            fontSize: `${sticker.size}cqw`,
            transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
          }}
        >
          {sticker.emoji}
        </span>
      ))}
    </div>
  );
}
