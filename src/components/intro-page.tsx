import Image from "next/image";

type IntroPageProps = {
  hasProviderProfile: boolean;
  onOpenExperience: () => void;
  onOpenLearn: () => void;
  onOpenProvider: () => void;
};

const steps = [
  ["01", "Learn", "自分の目的に合う先生や学び方を見つけます。"],
  ["02", "Experience", "街、食、文化の中で日本語を使う時間を選びます。"],
  ["03", "Connect", "気になる人と、無理のない会話からつながります。"],
];

const cases = [
  ["居酒屋で", "注文や会話を通して、教室の外の日本語にふれる。"],
  ["自然な会話で", "先生や地域の人と、あなたの興味から話しはじめる。"],
  ["ローカルな日本で", "観光だけでは見つからない、日常の景色を体験する。"],
];

export function IntroPage({ hasProviderProfile, onOpenExperience, onOpenLearn, onOpenProvider }: IntroPageProps) {
  return (
    <section aria-labelledby="intro-title" className="grid gap-12 pb-6">
      <div className="grid gap-6 border-b border-[#D9E1F5] pb-10 pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="text-sm font-semibold text-[#6E8FE8]">NIHONGO PALETTE</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-bold leading-tight text-[#17203D] sm:text-4xl" id="intro-title">日本語で過ごす時間を、自分らしく。</h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-[#42506F]">学ぶこと、体験すること、人とつながること。Nihongo Paletteは、日本語を通じてあなたらしい毎日をつくる場所です。</p>
        </div>
        <Image alt="Nihongo Palette" className="h-28 w-28 justify-self-start sm:justify-self-end" height={112} priority src="/brand/nihongo-palette-logo-mark.svg" width={112} />
      </div>

      <section aria-labelledby="voices-title">
        <h2 className="text-xl font-bold text-[#17203D]" id="voices-title">こんな時間から、はじまります。</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <blockquote className="rounded-lg border border-[#D9E1F5] bg-white p-5 text-sm leading-7 text-[#42506F]">「先生と話した日本の映画のことを、次の日に友人へ話せた。」</blockquote>
          <blockquote className="rounded-lg border border-[#F6D3AF] bg-[#FFF9ED] p-5 text-sm leading-7 text-[#42506F]">「ひとりでは入れなかったお店で、初めて注文できた。」</blockquote>
          <blockquote className="rounded-lg border border-[#CFE7DE] bg-[#F1FBF7] p-5 text-sm leading-7 text-[#42506F]">「好きなことが同じ人と、日本語で笑えた。」</blockquote>
        </div>
      </section>

      <section aria-labelledby="journey-title">
        <h2 className="text-xl font-bold text-[#17203D]" id="journey-title">Learn → Experience → Connect</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {steps.map(([number, title, copy]) => <article className="border-l-2 border-[#6E8FE8] pl-4" key={title}><p className="text-xs font-semibold text-[#6E8FE8]">{number}</p><h3 className="mt-2 text-lg font-bold text-[#17203D]">{title}</h3><p className="mt-2 text-sm leading-7 text-[#42506F]">{copy}</p></article>)}
        </div>
      </section>

      <section aria-labelledby="cases-title">
        <h2 className="text-xl font-bold text-[#17203D]" id="cases-title">日本語が、毎日の景色を広げる。</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {cases.map(([title, copy]) => <article className="rounded-lg border border-[#D9E1F5] bg-white p-5" key={title}><h3 className="text-lg font-bold text-[#17203D]">{title}</h3><p className="mt-2 text-sm leading-7 text-[#42506F]">{copy}</p></article>)}
        </div>
      </section>

      <section aria-labelledby="provider-title" className="border-y border-[#D9E1F5] py-8">
        <p className="text-sm font-semibold text-[#C9732D]">FOR PROVIDERS</p>
        <h2 className="mt-2 text-xl font-bold text-[#17203D]" id="provider-title">あなたの得意が、誰かの日本時間になる。</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#42506F]">先生、地域の案内役、文化や暮らしを伝える人。それぞれの経験を、ひとりの学習者との出会いにつなげます。</p>
      </section>

      <section aria-labelledby="palette-title" className="grid gap-3">
        <p className="text-sm font-semibold text-[#6E8FE8]">THE PALETTE</p>
        <h2 className="text-xl font-bold text-[#17203D]" id="palette-title">答えを一つに決めない、日本語の学び方。</h2>
        <p className="max-w-2xl text-sm leading-7 text-[#42506F]">必要な色を選び、重ね、試していく。Nihongo Paletteは、今のあなたに合う日本語の時間を一緒につくります。</p>
      </section>

      <section aria-labelledby="start-title" className="border-y-2 border-[#6E8FE8] bg-[#EAF0FF] px-5 py-8 sm:px-8">
        <h2 className="text-2xl font-bold text-[#17203D]" id="start-title">ここから、あなたのPaletteを一緒につくりましょう！</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <button className="rounded-lg border border-[#6E8FE8] bg-white p-5 text-left" onClick={onOpenLearn} type="button"><p className="text-sm font-semibold text-[#476BC7]">日本語を学ぶ</p><p className="mt-2 text-sm leading-6 text-[#42506F]">先生と、自分に合う学びを探す。</p></button>
          <button className="rounded-lg border border-[#F6D3AF] bg-white p-5 text-left" onClick={onOpenExperience} type="button"><p className="text-sm font-semibold text-[#C9732D]">日本を体験する</p><p className="mt-2 text-sm leading-6 text-[#42506F]">街、食、文化の時間を見つける。</p></button>
          <button className="rounded-lg border border-[#CFE7DE] bg-white p-5 text-left" onClick={onOpenProvider} type="button"><p className="text-sm font-semibold text-[#277A62]">提供する</p><p className="mt-2 text-sm leading-6 text-[#42506F]">{hasProviderProfile ? "サービスをつくり、届ける。" : "あなたの得意をプロフィールにする。"}</p></button>
        </div>
      </section>
    </section>
  );
}
