import s from '@/styles/Hero.module.css'

export default function Hero() {
  return (
    <>
      <section className={s.hero}>
        <div className={s.inner}>
          <h2 className={s.title}>She Holds In Fist the Truth.</h2>
          <blockquote className={s.quote}>
            <span className={`${s.quoteMark} ${s.quoteMarkOpen}`}>&ldquo;</span>
            当主体映射口癖，称呼即是秩序。我们按下 <strong>Shift</strong>，转换一切叙事。
            <span className={`${s.quoteMark} ${s.quoteMarkClose}`}>&rdquo;</span>
          </blockquote>
          <p className={s.credit}><em>&quot;She Holds In Fist the Truth.&quot;</em></p>
        </div>
        <div className={s.badge}>&#128214; Shift · 她时号</div>
      </section>
      <div className={s.waveDivider} />
    </>
  )
}
