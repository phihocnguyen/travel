"use client";

import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  Ref,
} from "react";
import {
  DEFAULT_TICKET_TITLE_TRANSFORM,
  type TicketDesign,
} from "@/lib/tickets/types";

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
  onTitlePointerDown?: (
    event: ReactPointerEvent<HTMLHeadingElement>,
  ) => void;
  onTextPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

function PhotoFrame({
  design,
  onPointerDown,
}: {
  design: TicketDesign;
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  const { image } = design;
  const interactive = Boolean(onPointerDown);

  return (
    <div
      onPointerDown={onPointerDown}
      className={`relative h-full w-full rounded-[1.3cqw] ${
        interactive ? "cursor-move touch-none" : ""
      }`}
      style={{
        backgroundColor: "transparent",
        transform: `translate(${image.x}%, ${image.y}%)`,
      }}
    >
      {image.url ? (
        <div
          className="absolute inset-0 rounded-[1.3cqw] bg-no-repeat"
          style={{
            backgroundImage: `url(${image.url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: `scale(${image.scale})`,
          }}
        />
      ) : null}
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
  onTitlePointerDown,
  onTextPointerDown,
}: {
  design: TicketDesign;
  variant?: "panel" | "overlay";
  onTitlePointerDown?: (event: ReactPointerEvent<HTMLHeadingElement>) => void;
  onTextPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  const overlay = variant === "overlay";
  const titleTransform =
    design.titleTransform ?? DEFAULT_TICKET_TITLE_TRANSFORM;
  const textTransform =
    design.textTransform ?? { scale: 0.88, x: 0, y: 0 };

  return (
    <div
      onPointerDown={onTextPointerDown}
      className={`relative z-10 flex min-h-0 flex-col justify-between ${
        overlay
          ? "w-[64%] p-[2.6%]"
          : "h-[82%] w-[84%] self-center justify-self-center p-[2%]"
      } ${onTextPointerDown ? "cursor-move touch-none" : ""}`}
      style={{
        color: design.theme.ink,
        transform: `translate(${textTransform.x}cqw, ${textTransform.y}cqw) scale(${textTransform.scale})`,
        transformOrigin: "center",
      }}
    >
      <FromTo design={design} />

      <div className="min-h-0">
        <h3
          onPointerDown={onTitlePointerDown}
          className={`w-full font-display leading-[1.05] tracking-tight break-words ${
            onTitlePointerDown ? "cursor-move touch-none select-none" : ""
          }`}
          style={{
            fontSize: overlay ? "2.9cqw" : "2.7cqw",
            transform: `translate(${titleTransform.x}cqw, ${titleTransform.y}cqw) scale(${titleTransform.scale})`,
            transformOrigin: "left center",
          }}
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
  onTitlePointerDown,
  onTextPointerDown,
}: {
  design: TicketDesign;
  onImagePointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onTitlePointerDown?: (event: ReactPointerEvent<HTMLHeadingElement>) => void;
  onTextPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div className="grid h-full grid-cols-[43%_1fr] gap-[4%]">
      <PhotoFrame design={design} onPointerDown={onImagePointerDown} />
      <TextCard
        design={design}
        onTitlePointerDown={onTitlePointerDown}
        onTextPointerDown={onTextPointerDown}
      />
    </div>
  );
}

function RightLayout({
  design,
  onImagePointerDown,
  onTitlePointerDown,
  onTextPointerDown,
}: {
  design: TicketDesign;
  onImagePointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onTitlePointerDown?: (event: ReactPointerEvent<HTMLHeadingElement>) => void;
  onTextPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div className="grid h-full grid-cols-[1fr_43%] gap-[4%]">
      <TextCard
        design={design}
        onTitlePointerDown={onTitlePointerDown}
        onTextPointerDown={onTextPointerDown}
      />
      <PhotoFrame design={design} onPointerDown={onImagePointerDown} />
    </div>
  );
}

function FullLayout({
  design,
  onImagePointerDown,
  onTitlePointerDown,
  onTextPointerDown,
}: {
  design: TicketDesign;
  onImagePointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onTitlePointerDown?: (event: ReactPointerEvent<HTMLHeadingElement>) => void;
  onTextPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0">
        <PhotoFrame design={design} onPointerDown={onImagePointerDown} />
      </div>

      <div className="absolute bottom-[4%] left-[4%]">
        <TextCard
          design={design}
          variant="overlay"
          onTitlePointerDown={onTitlePointerDown}
          onTextPointerDown={onTextPointerDown}
        />
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
  onTitlePointerDown,
  onTextPointerDown,
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
      data-ticket-preview
      onClick={onBackgroundClick}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={rootStyle}
      className={`relative overflow-hidden ${className}`}
    >
      <div data-ticket-content className="absolute inset-y-[19%] left-[37.5%] right-[8.5%] isolate overflow-hidden">
        {design.layout === "full" ? (
          <FullLayout
            design={design}
            onImagePointerDown={onImagePointerDown}
            onTitlePointerDown={onTitlePointerDown}
            onTextPointerDown={onTextPointerDown}
          />
        ) : design.layout === "right" ? (
          <RightLayout
            design={design}
            onImagePointerDown={onImagePointerDown}
            onTitlePointerDown={onTitlePointerDown}
            onTextPointerDown={onTextPointerDown}
          />
        ) : (
          <LeftLayout
            design={design}
            onImagePointerDown={onImagePointerDown}
            onTitlePointerDown={onTitlePointerDown}
            onTextPointerDown={onTextPointerDown}
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
      <div className="pointer-events-none absolute bottom-[5%] right-[8.5%] z-30 rounded bg-white/90 px-[1.2%] py-[0.4%] font-sans font-bold tracking-wider text-[#26392e]" style={{ fontSize: "1.6cqw" }}>
        {design.code ?? "MÃ VÉ CẤP KHI LƯU"}
      </div>
    </div>
  );
}
