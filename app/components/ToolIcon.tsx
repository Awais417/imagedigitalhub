// ilovepdf-style SVG icons for every tool

// ── Shared shape paths (50×50 viewBox) ──────────────────────────────────────
const S1F = "M32.324 15.656h-9.547c-2.477 0-3.375.258-4.28.742a5.04 5.04 0 0 0-2.098 2.102c-.484.902-.742 1.8-.742 4.277v9.547H5.18c-1.8 0-2.45-.187-3.113-.54A3.7 3.7 0 0 1 .54 30.257c-.352-.66-.54-1.31-.54-3.113V5.18c0-1.8.188-2.45.54-3.113S1.4.89 2.066.54 3.38 0 5.18 0h21.965c1.8 0 2.453.188 3.113.54a3.7 3.7 0 0 1 1.527 1.527c.352.66.54 1.313.54 3.113z"; // fwd src (L-shape)
const S2F = "M22.855 17.676H44.82c1.8 0 2.453.188 3.113.543a3.7 3.7 0 0 1 1.527 1.523c.352.66.54 1.313.54 3.113V44.82c0 1.8-.187 2.453-.54 3.113s-.867 1.176-1.527 1.527-1.312.54-3.113.54H22.855c-1.8 0-2.453-.187-3.113-.54a3.7 3.7 0 0 1-1.527-1.527c-.352-.66-.54-1.312-.54-3.113V22.855c0-1.8.188-2.453.54-3.113.348-.648.88-1.18 1.527-1.527.66-.352 1.313-.54 3.113-.54z"; // fwd dst
const S1R = "M17.676 34.344h9.55c2.477 0 3.375-.258 4.28-.742a5.04 5.04 0 0 0 2.098-2.102c.484-.902.742-1.8.742-4.277v-9.547H44.82c1.8 0 2.453.188 3.113.54s1.176.87 1.527 1.527.54 1.31.54 3.113V44.82c0 1.8-.187 2.453-.54 3.113a3.7 3.7 0 0 1-1.527 1.527c-.66.352-1.312.54-3.113.54H22.855c-1.8 0-2.453-.187-3.113-.54s-1.172-.87-1.527-1.527-.54-1.312-.54-3.113z"; // rev src
const S2R = "M27.145 32.324H5.18c-1.8 0-2.453-.187-3.113-.543S.89 30.914.54 30.254 0 28.95 0 27.145V5.18c0-1.8.188-2.453.54-3.113A3.7 3.7 0 0 1 2.066.539C2.727.188 3.38 0 5.18 0h21.965c1.8 0 2.453.188 3.113.54s1.172.87 1.527 1.527.54 1.313.54 3.113v21.965c0 1.8-.187 2.453-.54 3.113s-.87 1.176-1.527 1.527-1.312.54-3.113.54z"; // rev dst
const SOLID = "M8.012 0h33.977c2.785 0 3.797.29 4.816.836a5.66 5.66 0 0 1 2.36 2.363c.547 1.016.836 2.027.836 4.813v33.977c0 2.785-.29 3.797-.836 4.816a5.67 5.67 0 0 1-2.36 2.36c-1.02.547-2.03.836-4.816.836H8.012c-2.785 0-3.797-.29-4.816-.836a5.67 5.67 0 0 1-2.36-2.36C.29 45.785 0 44.773 0 41.988V8.012c0-2.785.29-3.797.836-4.816A5.64 5.64 0 0 1 3.2.836C4.215.29 5.227 0 8.012 0z";
const AF = "M14.477 7.52a.88.88 0 0 0-.883-.867c-.48 0-.883.39-.883.867v3.844L7.566 6.316a.89.89 0 0 0-1.246 0c-.168.16-.258.38-.258.61s.1.453.258.613l5.145 5.05H7.547c-.488 0-.883.387-.883.863s.398.867.883.867h6.055a.9.9 0 0 0 .332-.066.86.86 0 0 0 .473-.465.8.8 0 0 0 .066-.328z"; // arrow fwd
const AR = "M43.94 37.137c0-.477-.395-.863-.883-.863s-.883.387-.883.863v3.844l-5.145-5.047a.893.893 0 0 0-1.25 0 .85.85 0 0 0-.258.609.86.86 0 0 0 .258.613l5.145 5.05H37.01c-.488 0-.883.387-.883.867s.395.867.883.867h6.05a.9.9 0 0 0 .336-.07.87.87 0 0 0 .477-.465.8.8 0 0 0 .066-.332z"; // arrow rev

// ── Letter paths (50×50 space) ────────────────────────────────────────────────
const W2 = "M38.996 26.75h2.965l-2.94 14.64h-3.094l-1.777-9.035-1.824 9.035H29.12L26.2 26.75h3.164l1.508 9.363 1.938-9.363h3.004z"; // W in dst
const W1 = "M20.844 8.61h2.96l-2.94 14.64H17.77l-1.777-9.035-1.824 9.035h-3.203L8.04 8.61h3.164l1.508 9.363L14.65 8.61h3.004z"; // W in src
const P2 = "M38.367 34.648Q36.737 36 34.008 36H32.39v5H29V26.5h5.313q5.688 0 5.688 4.62 0 2.18-1.633 3.535zM33.82 29H32.5v4.5h1.32q2.68 0 2.68-2.273c0-1.484-.89-2.227-2.68-2.227z"; // P in dst
const P1 = "M19.367 17.156q-1.63 1.347-4.36 1.348H13.39V23.5H10V9h5.313Q21 9 21 13.62c0 1.453-.543 2.637-1.633 3.535zM14.82 11.5H13.5V16h1.32q2.68 0 2.68-2.273c0-1.484-.89-2.227-2.68-2.227z"; // P in src
const X2 = "m36.61 41-2.508-4.72c-.102-.176-.195-.5-.3-.973h-.04q-.071.334-.336 1.012L30.9 41H27l4.64-7.25-4.246-7.25h3.992l2.082 4.348c.164.344.313.754.438 1.227h.04c.082-.285.234-.703.457-1.266l2.316-4.31h3.66l-4.37 7.19L40.5 41z"; // X in dst
const X1 = "m19.11 23.5-2.508-4.72c-.102-.176-.195-.5-.3-.973h-.04q-.071.334-.336 1.012L13.4 23.5H9.5l4.64-7.25L9.895 9h3.992l2.082 4.348c.164.344.313.754.438 1.227h.04c.082-.285.234-.703.457-1.266L19.22 9h3.66l-4.37 7.19L23 23.5z"; // X in src
// Photo icon (in dst)
const PH2a = "M41.5 26a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"; // sun dot
const PH2b = "M30.6 39h-6.344c-.1 0-.172-.047-.215-.125s-.043-.168.004-.242l6.574-11.02a.26.26 0 0 1 .426 0l3.832 6.422 2.57-2.625a.247.247 0 0 1 .184-.074c.07 0 .137.03.18.086l6.1 7.13a.25.25 0 0 1 .11.203.246.246 0 0 1-.246.242H30.6z"; // landscape
// Photo icon (in src)
const PH1a = "M8.5 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4z";
const PH1b = "M18.4 21H12.056c-.1 0-.172-.047-.215-.125s-.043-.168.004-.242L18.42 9.613a.26.26 0 0 1 .426 0l3.832 6.422 2.57-2.625a.247.247 0 0 1 .184-.074c.07 0 .137.03.18.086l6.1 7.13a.25.25 0 0 1 .11.203.246.246 0 0 1-.246.242H18.4z";

// ── Color palettes ────────────────────────────────────────────────────────────
type Pal = { l: string; d: string; a: string };
const PAL: Record<string, Pal> = {
  word:  { l: '#DCE5FA', d: '#5F83C6', a: '#295795' },
  excel: { l: '#C2E5C3', d: '#5EA162', a: '#2E7237' },
  ppt:   { l: '#F3D9CC', d: '#FF7651', a: '#D04526' },
  jpg:   { l: '#FBEFA8', d: '#D6BF2D', a: '#B7A001' },
  html:  { l: '#FDE4D0', d: '#E87722', a: '#C05010' },
  epub:  { l: '#EDE9FE', d: '#7C3AED', a: '#5B21B6' },
  csv:   { l: '#D1FAE5', d: '#10B981', a: '#047857' },
  xml:   { l: '#DBEAFE', d: '#3B82F6', a: '#1D4ED8' },
  txt:   { l: '#F1F5F9', d: '#64748B', a: '#334155' },
  rtf:   { l: '#FCE4EC', d: '#E91E63', a: '#880E4F' },
  cad:   { l: '#E8EAF6', d: '#3949AB', a: '#1A237E' },
};

// ── Conv icon builder ─────────────────────────────────────────────────────────
function Conv({
  pal, dir, letter1, letter2, arrowColor,
}: {
  pal: Pal; dir: 'fwd' | 'rev';
  letter1?: string; letter2?: string;
  arrowColor?: string;
}) {
  const arrow = arrowColor ?? pal.a;
  if (dir === 'fwd') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 50 50">
        <path fill={pal.l} fillRule="evenodd" d={S1F} />
        <path fill={arrow} d={AF} />
        {letter1 && <path fill={arrow} d={letter1} />}
        <path fill={pal.d} fillRule="evenodd" d={S2F} />
        {letter2 && <path fill="#fff" d={letter2} />}
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 50 50">
      <path fill={pal.d} fillRule="evenodd" d={S1R} />
      {letter1 && <path fill="#fff" d={letter1} />}
      <path fill={pal.l} fillRule="evenodd" d={S2R} />
      <path fill={arrow} d={AR} />
      {letter2 && <path fill={arrow} d={letter2} />}
    </svg>
  );
}

// ── Solid icon builder ────────────────────────────────────────────────────────
function Solid({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 50 50">
      <path fill={bg} d={SOLID} />
      {children}
    </svg>
  );
}

// ── Pre-built solid icons ─────────────────────────────────────────────────────
const ORANGE = '#EE6C4D';
const PURPLE = '#AB6993';
const BLUE   = '#4A7AAB';
const GREEN  = '#8FBC5D';
const VIOLET = '#8B5CF6';
const TEAL   = '#14B8A6';

function MergeIcon() {
  return (
    <Solid bg={ORANGE}>
      <path fill="#fff" d="M17.906 10.965a.87.87 0 0 0-.875.86v3.8L9.84 8.523a.886.886 0 0 0-1.238 0 .86.86 0 0 0 0 1.205l7.195 7.098h-3.875c-.484 0-.875.387-.875.86s.4.86.875.86h5.984a.86.86 0 0 0 .871-.793V11.825a.86.86 0 0 0-.87-.86zm14.418 28.008c.48 0 .87-.383.87-.86v-3.797l7.195 7.098a.88.88 0 0 0 1.234 0 .86.86 0 0 0 0-1.21l-7.2-7.102h3.875c.484 0 .875-.383.875-.86s-.4-.855-.875-.855h-5.984a.86.86 0 0 0-.875.854v5.87c0 .477.4.86.875.86zM21.9 28.393c-.355.352-.93.352-1.285 0s-.355-.934 0-1.3a.91.91 0 0 1 1.285 0 .927.927 0 0 1 0 1.3m3.374-3.357a.914.914 0 0 1-1.285-1.285.914.914 0 0 1 1.285 0 .91.91 0 0 1 0 1.285m3.36-3.364a.914.914 0 0 1-1.285-1.285.91.91 0 0 1 1.285 0 .91.91 0 0 1 0 1.285z" />
    </Solid>
  );
}

function SplitIcon() {
  return (
    <Solid bg={ORANGE}>
      <path fill="#fff" d="M9.22 15.87a.87.87 0 0 0 .875-.86v-3.8l7.195 7.102a.88.88 0 0 0 1.234 0 .85.85 0 0 0 0-1.215L11.328 10h3.875c.484 0 .875-.387.875-.86s-.4-.86-.875-.86H9.22a.86.86 0 0 0-.871.859v5.875c0 .473.4.86.87.86zm31.793 18.2a.865.865 0 0 0-.875.855v3.8L32.94 31.63a.88.88 0 0 0-1.234 0 .85.85 0 0 0 0 1.21l7.2 7.1H35.02c-.48 0-.87.387-.87.86a.86.86 0 0 0 .871.855H41a.88.88 0 0 0 .871-.855V35.925a.87.87 0 0 0-.87-.855zm-18.78-5.187c-.355.352-.93.352-1.285 0s-.355-.934 0-1.3a.91.91 0 0 1 1.285 0 .927.927 0 0 1 0 1.3m3.365-3.367a.91.91 0 0 1-1.285 0 .91.91 0 0 1 0-1.285.914.914 0 0 1 1.285 0 .91.91 0 0 1 0 1.285m3.36-3.364a.91.91 0 0 1-1.285 0 .91.91 0 0 1 0-1.285.91.91 0 0 1 1.285 0 .91.91 0 0 1 0 1.285z" />
    </Solid>
  );
}

function CompressIcon() {
  return (
    <Solid bg={GREEN}>
      <path fill="#fff" d="M35 41.8c0 .48.398.867.883.867a.88.88 0 0 0 .883-.867v-3.844l5.145 5.05a.89.89 0 0 0 1.246 0 .85.85 0 0 0 0-1.226l-5.14-5.047h3.914a.876.876 0 0 0 0-1.734h-6.05a.875.875 0 0 0-.817.536.8.8 0 0 0-.066.328zm7.3-26.387c.48 0 .867-.398.867-.883a.88.88 0 0 0-.867-.883h-3.844l5.05-5.14a.9.9 0 0 0 0-1.25.86.86 0 0 0-1.227 0l-5.047 5.148V8.492a.876.876 0 1 0-1.734 0v6.05c0 .113.023.23.066.336a.86.86 0 0 0 .47.477.8.8 0 0 0 .332.07H42.3zM8.46 35c-.48 0-.867.398-.867.883s.387.883.867.883h3.844L7.254 41.9a.893.893 0 0 0 0 1.25.86.86 0 0 0 1.226 0l5.047-5.145v3.914a.867.867 0 1 0 1.734 0v-6.05a.875.875 0 0 0-.868-.883H8.46zm6.074-27.406a.874.874 0 0 0-.883.867v3.844l-5.145-5.05a.9.9 0 0 0-1.25 0A.86.86 0 0 0 7 7.867c0 .23.094.45.258.613l5.145 5.047H8.488a.875.875 0 1 0 0 1.734h6.05a.9.9 0 0 0 .336-.066c.215-.1.39-.258.477-.47.05-.102.07-.22.07-.332V8.46a.874.874 0 0 0-.883-.867z" />
    </Solid>
  );
}

function LockIcon({ open = false }: { open?: boolean }) {
  return (
    <Solid bg={BLUE}>
      {open ? (
        <>
          <rect x="14" y="23" width="22" height="17" rx="3" fill="#fff" />
          <path d="M14 27v-6a11 11 0 0 1 22 0" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M25 29v5" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="25" cy="29" r="2.5" fill={BLUE} />
        </>
      ) : (
        <>
          <rect x="14" y="23" width="22" height="17" rx="3" fill="#fff" />
          <path d="M18 23v-5a7 7 0 0 1 14 0v5" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M25 29v5" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="25" cy="29" r="2.5" fill={BLUE} />
        </>
      )}
    </Solid>
  );
}

function ShieldIcon() {
  return (
    <Solid bg={BLUE}>
      <path fill="#fff" d="M25 8l16 7.5v11c0 8.5-7 15.5-16 18-9-2.5-16-9.5-16-18v-11L25 8z" />
      <path d="M19 25l4 4 8-8" stroke={BLUE} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Solid>
  );
}

function EditIcon() {
  return (
    <Solid bg={PURPLE}>
      <path fill="#fff" d="M32 12l6 6-16 16H16v-6L32 12zm2-2l4 4 2-2a2.83 2.83 0 0 0-4-4l-2 2z" />
    </Solid>
  );
}

function WatermarkIcon() {
  return (
    <Solid bg={PURPLE}>
      <path fill="#fff" d="M22.7 22.523c0 .863-1.094 3.023-2.11 4.668a.68.68 0 0 0-.078.523.64.64 0 0 0 .61.47h7.75a.63.63 0 0 0 .566-.352.65.65 0 0 0-.055-.672c-1.445-1.97-2.1-3.398-2.1-4.633s.645-2.66 2.094-4.637a5.5 5.5 0 0 0 1.012-3.195c0-3.02-2.422-5.477-5.398-5.477s-5.398 2.45-5.398 5.473a5.5 5.5 0 0 0 1.02 3.203c1.44 1.97 2.086 3.398 2.086 4.63zm14.02 6.55H13.266a.64.64 0 0 0-.633.645v6.465c0 .352.285.645.633.645H36.72a.64.64 0 0 0 .633-.645V29.72a.643.643 0 0 0-.633-.645zm-3.582 8.7H16.863a.643.643 0 0 0-.633.645v.727c0 .352.285.645.633.645h16.273a.643.643 0 0 0 .633-.645v-.727a.643.643 0 0 0-.633-.645z" />
    </Solid>
  );
}

function RotateIcon() {
  return (
    <Solid bg={PURPLE}>
      <path fill="#fff" d="M25.366 13.26a1.25 1.25 0 1 1 .318 2.48c-5.352.686-9.434 5.212-9.434 10.638 0 4.407 2.692 8.285 6.726 9.926a1.25 1.25 0 0 1-.942 2.316c-4.963-2.02-8.284-6.804-8.284-12.242 0-6.697 5.03-12.273 11.616-13.118m14.778 11.437a1.25 1.25 0 1 1-2.475.354 11.6 11.6 0 0 0-.905-3.163 1.25 1.25 0 1 1 2.278-1.03 14 14 0 0 1 1.102 3.84zM28.71 39.493a1.25 1.25 0 0 1-.354-2.475c1.1-.157 2.125-.445 3.09-.872a1.25 1.25 0 0 1 1.013 2.286 14 14 0 0 1-3.748 1.06zm8.792-4.998a1.25 1.25 0 1 1-2-1.5q1.078-1.434 1.627-2.866a1.25 1.25 0 1 1 2.335.893C39 32.206 38.35 33.36 37.5 34.495z" />
      <path fill="#fff" d="M26.282 21a.786.786 0 0 1-.78-.78V9.28c0-.427.354-.78.78-.78.208 0 .403.085.55.232l5.47 5.47c.146.146.232.342.232.55s-.085.403-.232.55l-5.47 5.47a.78.78 0 0 1-.55.232z" />
    </Solid>
  );
}

function OcrIcon() {
  return (
    <Solid bg={ORANGE}>
      <rect x="10" y="13" width="30" height="5" rx="2.5" fill="#fff" opacity=".4" />
      <rect x="10" y="22" width="20" height="5" rx="2.5" fill="#fff" opacity=".4" />
      <rect x="10" y="31" width="25" height="5" rx="2.5" fill="#fff" opacity=".4" />
      <circle cx="38" cy="35" r="7" fill="#fff" opacity=".2" />
      <circle cx="38" cy="35" r="4" fill="#fff" opacity=".3" />
      <circle cx="38" cy="35" r="2" fill="#fff" />
    </Solid>
  );
}

function PageNumIcon() {
  return (
    <Solid bg={PURPLE}>
      <rect x="10" y="9" width="20" height="26" rx="2" fill="#fff" opacity=".3" />
      <rect x="14" y="9" width="20" height="26" rx="2" fill="#fff" opacity=".5" />
      <rect x="18" y="9" width="20" height="26" rx="2" fill="#fff" />
      <text x="28" y="30" fontSize="10" fontWeight="bold" fill={PURPLE} textAnchor="middle">1</text>
    </Solid>
  );
}

function ImageIcon({ bg = VIOLET }: { bg?: string }) {
  return (
    <Solid bg={bg}>
      <circle cx="18" cy="18" r="5" fill="#fff" opacity=".4" />
      <circle cx="18" cy="18" r="2.5" fill="#fff" />
      <path fill="#fff" d="M8 38h34a1 1 0 0 0 .9-1.4l-9-18a1 1 0 0 0-1.8 0l-7 14-4-8a1 1 0 0 0-1.8 0l-12 12.4A1 1 0 0 0 8 38z" />
    </Solid>
  );
}

function FormIcon() {
  return (
    <Solid bg="#7C3AED">
      <rect x="11" y="12" width="28" height="3.5" rx="1.5" fill="#fff" opacity=".5" />
      <rect x="11" y="19" width="28" height="3.5" rx="1.5" fill="#fff" opacity=".5" />
      <rect x="11" y="26" width="18" height="3.5" rx="1.5" fill="#fff" opacity=".5" />
      <rect x="11" y="33" width="12" height="7" rx="2" fill="#fff" />
    </Solid>
  );
}

function RepairIcon() {
  return (
    <Solid bg={GREEN}>
      <path fill="#fff" d="M20.816 27.363a.5.5 0 0 1 .18.39c0 .12-.04.234-.113.324l-6.563 7.906a.51.51 0 0 1-.715.063.52.52 0 0 1-.18-.391.53.53 0 0 1 .117-.328l6.56-7.902a.5.5 0 0 1 .71-.063zm2.13 1.793a.51.51 0 0 1 .066.715l-6.562 7.906a.505.505 0 0 1-.711-.308.52.52 0 0 1 .117-.328l6.56-7.902a.505.505 0 0 1 .714-.063zM12.13 32.466a2.764 2.764 0 0 0 .344 3.86l1.238 1.043a2.72 2.72 0 0 0 3.836-.352l6.953-8.367-5.516-5.852zm21.13-18.527a4.4 4.4 0 0 1 1.32-1.062l.313-.16c.387-.203.723-.473.996-.8l1.04-1.25c.137-.164.078-.44-.13-.613l-1.69-1.418c-.21-.176-.488-.184-.625-.02l-1.04 1.25a3.3 3.3 0 0 0-.609 1.125l-.102.336a4.3 4.3 0 0 1-.805 1.492L26.5 21.32l1.29 1.18zm3.082 21.637a1.81 1.81 0 0 1-1.305.484 1.8 1.8 0 0 1-1.262-.578 1.824 1.824 0 0 1 .094-2.574 1.82 1.82 0 0 1 2.567.094 1.83 1.83 0 0 1-.094 2.574M24.1 20.996c-.906-.848-1.36-2.1-1.156-3.316a6.05 6.05 0 0 0-1.527-5.094 6 6 0 0 0-4.852-1.906.376.376 0 0 0-.246.63l2.742 2.965a1.46 1.46 0 0 1-.074 2.051l-2.492 2.324a1.44 1.44 0 0 1-1.007-.461l-2.734-2.953a.37.37 0 0 0-.65.203c-.25 1.773.273 3.648 1.6 5.035a6.01 6.01 0 0 0 4.836 1.852 3.75 3.75 0 0 1 3.215 1.398L32.5 38.828c1.38 1.484 3.7 1.566 5.18.19s1.563-3.72.19-5.2z" />
    </Solid>
  );
}

function OrganizeIcon() {
  return (
    <Solid bg={ORANGE}>
      <rect x="6" y="6" width="16" height="16" rx="3" fill="#fff" opacity=".5" />
      <rect x="28" y="6" width="16" height="16" rx="3" fill="#fff" opacity=".5" />
      <rect x="6" y="28" width="16" height="16" rx="3" fill="#fff" opacity=".5" />
      <rect x="28" y="28" width="16" height="16" rx="3" fill="#fff" />
      <path stroke={ORANGE} strokeWidth="1.5" fill="none" d="M14 22v6M14 14h8M36 22v6M36 28" strokeLinecap="round" />
    </Solid>
  );
}

function StandardsIcon() {
  return (
    <Solid bg="#4A7AAB">
      <text x="25" y="21" fontSize="9" fontWeight="900" fill="#fff" textAnchor="middle">PDF</text>
      <text x="25" y="33" fontSize="8" fontWeight="900" fill="#fff" opacity=".8" textAnchor="middle">/A</text>
      <rect x="10" y="36" width="30" height="2" rx="1" fill="#fff" opacity=".4" />
    </Solid>
  );
}

function SignIcon() {
  return (
    <Solid bg={BLUE}>
      <path fill="#fff" d="m22 32-.5 12c.03.1.08.17.17.18s.14-.01.18-.08l3.7-6.4a3.66 3.66 0 0 0 2.86-8.44 3.66 3.66 0 0 0-3.7 5.44zM30 18.7l-6.3-3.64c-.38-.22-.48-.85-.23-1.42l1.83-3.17c.3-.51.89-.74 1.27-.52l6.3 3.64c.43.25.52.88.26 1.39l-1.83 3.17c-.3.51-.89.74-1.32.5z" />
    </Solid>
  );
}

function RedactIcon() {
  return (
    <Solid bg="#1F2937">
      <rect x="9" y="14" width="32" height="6" rx="2" fill="#fff" />
      <rect x="9" y="24" width="22" height="6" rx="2" fill="#fff" opacity=".3" />
      <rect x="9" y="34" width="27" height="6" rx="2" fill="#fff" opacity=".3" />
    </Solid>
  );
}

function StampIcon() {
  return (
    <Solid bg={BLUE}>
      <path fill="#fff" d="M12 30h26v8H12zM20 14a5 5 0 1 1 10 0v8a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3z" />
    </Solid>
  );
}

function DigitalIdIcon() {
  return (
    <Solid bg={BLUE}>
      <rect x="10" y="14" width="30" height="22" rx="3" fill="#fff" opacity=".25" />
      <circle cx="20" cy="24" r="5" fill="#fff" opacity=".7" />
      <rect x="28" y="20" width="10" height="2.5" rx="1.2" fill="#fff" opacity=".7" />
      <rect x="28" y="25" width="7" height="2.5" rx="1.2" fill="#fff" opacity=".7" />
      <rect x="10" y="38" width="30" height="3" rx="1.5" fill="#fff" opacity=".4" />
    </Solid>
  );
}

function ValidateIcon() {
  return (
    <Solid bg={BLUE}>
      <path fill="#fff" d="M25 9l14 6.5v10c0 7.5-6 13.5-14 16-8-2.5-14-8.5-14-16v-10z" opacity=".4" />
      <path fill="#fff" d="M25 11l12 5.5v9c0 6.5-5 11.5-12 14-7-2.5-12-7.5-12-14v-9z" />
      <path d="M18 25l5 5 9-9" stroke={BLUE} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Solid>
  );
}

function SetPermsIcon() {
  return (
    <Solid bg={BLUE}>
      <rect x="13" y="22" width="24" height="17" rx="3" fill="#fff" />
      <path d="M18 22v-5a7 7 0 0 1 14 0v5" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M19 30h3M19 34h6" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="32" cy="30" r="2" fill={BLUE} />
      <path d="M32 32v3" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" />
    </Solid>
  );
}

function BatesIcon() {
  return (
    <Solid bg={PURPLE}>
      <rect x="10" y="10" width="30" height="30" rx="3" fill="#fff" opacity=".2" />
      <text x="25" y="28" fontSize="8" fontWeight="900" fill="#fff" textAnchor="middle">BATES</text>
      <text x="25" y="37" fontSize="7" fontWeight="700" fill="#fff" opacity=".7" textAnchor="middle">001-999</text>
    </Solid>
  );
}

function StickyNoteIcon() {
  return (
    <Solid bg="#F59E0B">
      <rect x="10" y="10" width="30" height="30" rx="2" fill="#fff" opacity=".9" />
      <rect x="10" y="10" width="30" height="8" rx="2" fill="#F59E0B" />
      <rect x="14" y="22" width="22" height="2" rx="1" fill="#94A3B8" />
      <rect x="14" y="27" width="16" height="2" rx="1" fill="#94A3B8" />
      <rect x="14" y="32" width="19" height="2" rx="1" fill="#94A3B8" />
    </Solid>
  );
}

function HighlightIcon() {
  return (
    <Solid bg="#FBBF24">
      <rect x="10" y="15" width="30" height="4" rx="2" fill="#fff" opacity=".4" />
      <rect x="10" y="23" width="30" height="4" rx="2" fill="#fff" opacity=".9" />
      <rect x="10" y="31" width="20" height="4" rx="2" fill="#fff" opacity=".4" />
    </Solid>
  );
}

function ResizeIcon() {
  return (
    <Solid bg={TEAL}>
      <rect x="8" y="8" width="20" height="20" rx="2" fill="#fff" opacity=".5" />
      <rect x="22" y="22" width="20" height="20" rx="2" fill="#fff" />
      <path d="M26 26l-10-10M26 16h-10v10" stroke={TEAL} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Solid>
  );
}

function CropIcon() {
  return (
    <Solid bg={TEAL}>
      <path fill="#fff" d="M12 10v20h20v8h3v-8h5v-3h-5V10zm3 3h14v14H15zM10 35h8v3H10z" />
    </Solid>
  );
}

function UpscaleIcon() {
  return (
    <Solid bg={VIOLET}>
      <path fill="#fff" d="M8 42h34v-2H8zM25 10l-8 12h5v10h6V22h5z" />
    </Solid>
  );
}

function BlurIcon({ unblur = false }: { unblur?: boolean }) {
  return (
    <Solid bg={TEAL}>
      {unblur ? (
        <>
          <circle cx="25" cy="22" r="8" fill="#fff" opacity=".3" />
          <circle cx="25" cy="22" r="5" fill="#fff" opacity=".6" />
          <circle cx="25" cy="22" r="2" fill="#fff" />
          <path d="M10 22 Q17 14 25 22 Q33 30 40 22" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="25" cy="22" r="10" fill="#fff" opacity=".1" />
          <circle cx="25" cy="22" r="7" fill="#fff" opacity=".2" />
          <circle cx="25" cy="22" r="4" fill="#fff" opacity=".4" />
          <circle cx="25" cy="22" r="2" fill="#fff" opacity=".6" />
        </>
      )}
      <rect x="10" y="34" width="30" height="3" rx="1.5" fill="#fff" opacity=".4" />
    </Solid>
  );
}

function FlipIcon() {
  return (
    <Solid bg={TEAL}>
      <path fill="#fff" d="M8 25h34v-2H8zM14 14l-5 9h4v5h2v-5h4zM36 14l5 9h-4v5h-2v-5h-4z" />
    </Solid>
  );
}

function RemoveBgIcon() {
  return (
    <Solid bg={VIOLET}>
      <rect x="9" y="9" width="32" height="32" rx="3" fill="#fff" opacity=".15" stroke="#fff" strokeWidth="1.5" strokeDasharray="3 2" />
      <circle cx="25" cy="22" r="7" fill="#fff" />
      <path fill="#fff" d="M13 38c0-6.627 5.373-10 12-10s12 3.373 12 10H13z" />
    </Solid>
  );
}

function MemeIcon() {
  return (
    <Solid bg="#EC4899">
      <rect x="9" y="9" width="32" height="32" rx="3" fill="#fff" opacity=".2" />
      <text x="25" y="24" fontSize="8" fontWeight="900" fill="#fff" textAnchor="middle">TOP</text>
      <rect x="12" y="26" width="26" height="1.5" fill="#fff" opacity=".5" />
      <text x="25" y="37" fontSize="8" fontWeight="900" fill="#fff" textAnchor="middle">BTM</text>
    </Solid>
  );
}

function PhotoEditorIcon() {
  return (
    <Solid bg="#EC4899">
      <circle cx="25" cy="22" r="9" fill="#fff" opacity=".3" />
      <circle cx="25" cy="22" r="6" fill="#fff" opacity=".5" />
      <circle cx="25" cy="22" r="3" fill="#fff" />
      <rect x="10" y="34" width="30" height="6" rx="2" fill="#fff" opacity=".4" />
      <rect x="11" y="35" width="7" height="4" rx="1.5" fill="#fff" />
    </Solid>
  );
}

function HtmlIcon({ fwd = true }: { fwd?: boolean }) {
  if (fwd) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 100 100">
        <path fill="#fbefa8" fillRule="evenodd" d="M35.354 68.687h19.1c4.953 0 6.75-.516 8.56-1.484s3.232-2.39 4.2-4.2 1.484-3.607 1.484-8.56v-19.1H89.64c3.602 0 4.908.375 6.225 1.08a7.34 7.34 0 0 1 3.055 3.055c.704 1.317 1.08 2.623 1.08 6.225V89.64c0 3.602-.375 4.908-1.08 6.225a7.34 7.34 0 0 1-3.055 3.055c-1.317.704-2.623 1.08-6.225 1.08H45.713c-3.602 0-4.908-.375-6.225-1.08a7.34 7.34 0 0 1-3.055-3.055c-.704-1.317-1.08-2.623-1.08-6.225z" />
        <path fill="#b7a001" fillRule="nonzero" d="M87.88 74.277c0-.957-.79-1.733-1.766-1.733s-1.766.776-1.766 1.733v7.686L74.06 71.864a1.79 1.79 0 0 0-2.496 0 1.71 1.71 0 0 0 0 2.45L81.85 84.413h-7.828a1.733 1.733 0 1 0 0 3.466h12.1a1.8 1.8 0 0 0 .674-.133c.43-.175.776-.513.954-.937.1-.21.136-.436.136-.66z" />
        <path fill="#d6bf2d" d="M10.36 0h43.928c3.602 0 4.908.375 6.225 1.08a7.34 7.34 0 0 1 3.055 3.055c.704 1.317 1.08 2.623 1.08 6.225v43.928c0 3.602-.375 4.908-1.08 6.225a7.34 7.34 0 0 1-3.055 3.055c-1.317.704-2.623 1.08-6.225 1.08H10.36c-3.602 0-4.908-.375-6.225-1.08a7.34 7.34 0 0 1-3.055-3.055C.375 59.196 0 57.89 0 54.287V10.36c0-3.603.375-4.91 1.08-6.226a7.34 7.34 0 0 1 3.055-3.055C5.45.375 6.757 0 10.36 0" />
        <path fill="#fff" fillRule="nonzero" d="M6.444 37.69V26.63c0-.93.608-1.558 1.558-1.558S9.56 25.7 9.56 26.63v3.876h5.662V26.63c0-.93.608-1.558 1.558-1.558s1.558.627 1.558 1.558v11.06c0 .93-.608 1.558-1.558 1.558s-1.558-.627-1.558-1.558v-4.56H9.56v4.56c0 .93-.608 1.558-1.558 1.558s-1.558-.627-1.558-1.558m18.126 0v-9.747h-2.945c-.893 0-1.615-.456-1.615-1.31s.722-1.31 1.615-1.31h9.006c.893 0 1.615.456 1.615 1.31s-.722 1.31-1.615 1.31h-2.945v9.747c0 .93-.608 1.558-1.558 1.558s-1.558-.627-1.558-1.558m9.29.038V26.612c0-1.254.855-1.54 1.69-1.54h.912c.97 0 1.425.38 1.748 1.425l2.717 8.778h.038l2.68-8.778c.323-1.045.78-1.425 1.748-1.425h.874c.836 0 1.69.285 1.69 1.54v11.115c0 .78-.38 1.52-1.387 1.52s-1.387-.74-1.387-1.52v-8.474h-.038l-2.907 9.082c-.21.646-.684.912-1.33.912s-1.12-.266-1.33-.912l-2.907-9.082h-.038v8.474c0 .78-.38 1.52-1.387 1.52s-1.387-.74-1.387-1.52zm16.93-.55V26.63c0-.93.608-1.558 1.558-1.558s1.558.627 1.558 1.558v9.747h5.206c.893 0 1.615.456 1.615 1.31S60.005 39 59.112 39h-6.498c-1.102 0-1.824-.437-1.824-1.824z" />
      </svg>
    );
  }
  // html-to-pdf (reverse) - HTML is source
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 100 100">
      <path fill="#d6bf2d" fillRule="evenodd" d="M64.646 31.313H45.54c-4.957 0-6.75.516-8.56 1.485a10.12 10.12 0 0 0-4.204 4.204c-.969 1.81-1.485 3.607-1.485 8.56v19.1H10.36c-3.605 0-4.913-.375-6.23-1.08a7.35 7.35 0 0 1-3.057-3.057C.375 59.208 0 57.9 0 54.295V10.36c0-3.605.375-4.913 1.08-6.23a7.35 7.35 0 0 1 3.058-3.06C5.456.375 6.763 0 10.37 0h43.97c3.605 0 4.913.375 6.23 1.08a7.35 7.35 0 0 1 3.057 3.057c.705 1.318 1.08 2.625 1.08 6.23v20.946z" />
      <path fill="#b7a001" fillRule="nonzero" d="M27.94 14.624a1.696 1.696 0 1 0-3.394 0v7.525L14.66 12.262a1.697 1.697 0 1 0-2.4 2.4l9.887 9.887h-7.523a1.697 1.697 0 1 0 0 3.394h11.62a1.7 1.7 0 0 0 .647-.131 1.69 1.69 0 0 0 1.047-1.564z" />
      <path fill="#fbefa8" d="M45.663 35.294h43.97c3.605 0 4.913.375 6.23 1.08a7.35 7.35 0 0 1 3.057 3.057c.705 1.318 1.08 2.625 1.08 6.23v43.97c0 3.605-.375 4.913-1.08 6.23a7.35 7.35 0 0 1-3.057 3.057c-1.318.705-2.625 1.08-6.23 1.08h-43.97c-3.605 0-4.913-.375-6.23-1.08a7.35 7.35 0 0 1-3.057-3.057c-.705-1.318-1.08-2.625-1.08-6.23v-43.97c0-3.605.375-4.913 1.08-6.23a7.35 7.35 0 0 1 3.057-3.057c1.318-.705 2.625-1.08 6.23-1.08" />
      <path fill="#b7a001" fillRule="nonzero" d="M87.88 74.277c0-.957-.79-1.733-1.766-1.733s-1.766.776-1.766 1.733v7.686L74.06 71.864a1.79 1.79 0 0 0-2.496 0 1.71 1.71 0 0 0 0 2.45L81.85 84.413h-7.828a1.733 1.733 0 1 0 0 3.466h12.1a1.8 1.8 0 0 0 1.764-1.73z" />
    </svg>
  );
}

// ── Main map & export ─────────────────────────────────────────────────────────
export function ToolIcon({ slug }: { slug: string }) {
  switch (slug) {
    // ── Organize ──────────────────────────────────────────────────────────────
    case 'merge':          return <MergeIcon />;
    case 'split':          return <SplitIcon />;
    case 'selective-merge':
    case 'reorder-pages':
    case 'organize-pdf':   return <OrganizeIcon />;
    case 'split-by-size':
    case 'split-by-bookmark': return <SplitIcon />;
    case 'delete-pages':
    case 'extract-pages':  return <SplitIcon />;
    case 'rotate-pages':
    case 'reverse-pages':  return <RotateIcon />;

    // ── Optimize ──────────────────────────────────────────────────────────────
    case 'compress':       return <CompressIcon />;
    case 'repair':         return <RepairIcon />;
    case 'rotate':         return <RotateIcon />;

    // ── TO PDF ────────────────────────────────────────────────────────────────
    case 'word-to-pdf':    return <Conv pal={PAL.word}  dir="rev" letter1={W1} />;
    case 'excel-to-pdf':   return <Conv pal={PAL.excel} dir="rev" letter1={X1} />;
    case 'ppt-to-pdf':     return <Conv pal={PAL.ppt}   dir="rev" letter1={P1} />;
    case 'image-to-pdf':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 50 50">
          <path fill={PAL.jpg.d} fillRule="evenodd" d={S1R} />
          <path fill="#fff" d={PH1a} /><path fill="#fff" d={PH1b} />
          <path fill={PAL.jpg.l} fillRule="evenodd" d={S2R} />
          <path fill={PAL.jpg.a} d={AR} />
        </svg>
      );
    case 'html-to-pdf':    return <HtmlIcon fwd={false} />;
    case 'rtf-to-pdf':     return <Conv pal={PAL.rtf}  dir="rev" />;
    case 'epub-to-pdf':    return <Conv pal={PAL.epub} dir="rev" />;
    case 'cad-to-pdf':     return <Conv pal={PAL.cad}  dir="rev" />;

    // ── FROM PDF ──────────────────────────────────────────────────────────────
    case 'pdf-to-word':    return <Conv pal={PAL.word}  dir="fwd" letter2={W2} />;
    case 'pdf-to-excel':   return <Conv pal={PAL.excel} dir="fwd" letter2={X2} />;
    case 'pdf-to-html':    return <HtmlIcon fwd={true} />;
    case 'pdf-to-epub':    return <Conv pal={PAL.epub}  dir="fwd" />;
    case 'pdf-to-csv':     return <Conv pal={PAL.csv}   dir="fwd" />;
    case 'pdf-to-xml':     return <Conv pal={PAL.xml}   dir="fwd" />;
    case 'pdf-to-text':    return <Conv pal={PAL.txt}   dir="fwd" />;
    case 'pdf-to-image':
    case 'extract':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 50 50">
          <path fill={PAL.jpg.l} fillRule="evenodd" d={S1F} />
          <path fill={PAL.jpg.a} d={AF} />
          <path fill={PAL.jpg.d} fillRule="evenodd" d={S2F} />
          <path fill="#fff" d={PH2a} /><path fill="#fff" d={PH2b} />
        </svg>
      );

    // ── Edit ──────────────────────────────────────────────────────────────────
    case 'watermark':      return <WatermarkIcon />;
    case 'image-watermark':return <WatermarkIcon />;
    case 'page-numbers':   return <PageNumIcon />;
    case 'ocr':            return <OcrIcon />;
    case 'add-text-box':
    case 'edit-text':      return <EditIcon />;
    case 'sticky-note':    return <StickyNoteIcon />;
    case 'highlight':      return <HighlightIcon />;
    case 'underline':
    case 'strikeout':      return <EditIcon />;
    case 'bates-numbering':return <BatesIcon />;

    // ── Security ──────────────────────────────────────────────────────────────
    case 'protect':        return <LockIcon />;
    case 'unlock':         return <LockIcon open />;
    case 'set-permissions':return <SetPermsIcon />;
    case 'redact':         return <RedactIcon />;
    case 'stamp':          return <StampIcon />;
    case 'digital-id':     return <DigitalIdIcon />;
    case 'validate-signature': return <ValidateIcon />;
    case 'sign-pdf':       return <SignIcon />;

    // ── Forms ─────────────────────────────────────────────────────────────────
    case 'create-form':
    case 'fill-form':
    case 'export-form-data':
    case 'validate-form':
    case 'form-field-management': return <FormIcon />;

    // ── Standards ─────────────────────────────────────────────────────────────
    case 'pdf-to-pdfa':
    case 'validate-pdfa':
    case 'pdf-to-pdfx':
    case 'pdf-to-pdfe':
    case 'pdf-to-pdfua':   return <StandardsIcon />;

    // ── Image Convert ─────────────────────────────────────────────────────────
    case 'jpg-jpeg-update':
    case 'jpg-to-png':     return <Conv pal={PAL.jpg} dir="fwd" />;
    case 'png-to-jpg':     return <Conv pal={PAL.jpg} dir="rev" />;
    case 'image-format-converter': return <ImageIcon bg={VIOLET} />;
    case 'html-to-image':  return <HtmlIcon fwd={true} />;

    // ── Image Size ────────────────────────────────────────────────────────────
    case 'image-compress': return <CompressIcon />;
    case 'image-resize':   return <ResizeIcon />;
    case 'image-crop':     return <CropIcon />;
    case 'ai-upscale':     return <UpscaleIcon />;

    // ── Image Enhance ─────────────────────────────────────────────────────────
    case 'image-unblur':   return <BlurIcon unblur />;
    case 'image-blur':     return <BlurIcon />;
    case 'image-rotate':   return <RotateIcon />;
    case 'image-tilt-flip':return <FlipIcon />;

    // ── Image Edit ────────────────────────────────────────────────────────────
    case 'remove-background': return <RemoveBgIcon />;
    case 'image-add-watermark': return <WatermarkIcon />;
    case 'meme-generator': return <MemeIcon />;
    case 'photo-editor':   return <PhotoEditorIcon />;

    default:               return <ImageIcon />;
  }
}
