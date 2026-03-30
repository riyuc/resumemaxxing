const PUBLISH_DATE = 'March 2026'

const ManifestoPage = () => {
  return (
    <main className="min-h-screen px-6 py-20">
      <article className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="mb-16">
          <p className="font-jetbrains text-[11px] text-payne-gray tracking-widest uppercase mb-6">
            {PUBLISH_DATE} &mdash; manifesto
          </p>
          <h1 className="font-jetbrains text-3xl font-bold text-[#e8f0fc] leading-snug mb-6">
            stop spraying your resume at the wall and hoping something sticks.
          </h1>
          <div className="w-12 h-px bg-[#1e3a5f]" />
        </header>

        {/* Body */}
        <div className="font-jetbrains text-sm text-[#94a3b8] leading-[1.9] space-y-8">
          <p>something broke in the job market.</p>

          <p>
            a few years ago, applying to 20 jobs was a lot. you wrote a cover letter. you read the
            job description. you thought about whether you actually wanted to work there. it took
            effort, and that effort was a natural filter — for you, and for the recruiter on the
            other side.
          </p>

          <p>
            then the tools came. autofill. one-click apply. ai resume writers that would tailor your
            resume to any job description in seconds. overnight, the cost of applying dropped to
            nearly zero.
          </p>

          <p className="text-white">and people lost their minds.</p>

          <p>
            500 applications in a month. 1,000. "i applied to everything!" bots running overnight,
            submitting on your behalf while you sleep. now we have SWEs applying for dish washer
            positions, and dish washers applies for a SWE position, without even knowing. the
            spray-and-pray method.
          </p>

          <p>
            you might think, damn isn't that good for us? but look from the other side: recruiters
            drowning in applications, most of which are clearly mass-generated. they are forced to
            only look at ur resume for 7 seconds. they rely on ats keyword filters. they screen
            harder and faster, because they have no choice. good candidates get filtered out because
            their resume didn't have the right synonym. hiring gets slower. offers go to whoever
            gamed the system best — not whoever was actually the best fit.
          </p>

          <p>
            nobody wins. the applicant doesn't get the job. the recruiter can't find the right
            person. the company makes a bad hire or no hire. and the cycle gets worse every quarter
            as the tools get better and the volume goes up.
          </p>

          <hr className="border-[#1a3050] my-10" />

          <p className="text-white">
            we built this because we believe the problem isn't ai. it's how people are using it.
          </p>

          <p>
            ai shouldn't be a firehose. it should be a sharpening tool. it should take what you've
            actually done — your real experience, your real projects, your real skills — and help
            you communicate it as clearly and compellingly as possible to the specific role you
            actually want.
          </p>

          <p>intentional applying is a different game. it means:</p>

          <ul className="space-y-3 pl-4 border-l border-[#1e3a5f]">
            <li className="pl-4">
              reading the job description and asking honestly — does this match where i am and where
              i want to go?
            </li>
            <li className="pl-4">
              understanding what they're actually looking for, and being honest about whether you
              bring it.
            </li>
            <li className="pl-4">
              tailoring your resume not to fool an ats, but to give a human recruiter the clearest
              possible picture of why you're the right person.
            </li>
            <li className="pl-4">
              applying to 10 roles you genuinely want over applying to 500 you don't care about.
            </li>
          </ul>

          <p>
            quality is a strategy. a targeted, well-crafted application to a role you're a strong
            fit for will outperform 50 generic ones almost every time. the cycles where I tailor my
            resume got me so much more interviews than cycles where I mass-apply.
          </p>

          <hr className="border-[#1a3050] my-10" />

          <p>so here's what we built:</p>

          <p>
            a place to build your full career profile — everything you've done, in your own words,
            with as much detail as you want. not a resume. a source of truth.
          </p>

          <p>
            then, when you find a role you actually want, we help you pull from that profile to
            build a targeted resume that's honest, sharp, and specific to that opportunity. we
            rewrite your bullets in the language the jd is speaking. we surface what's relevant and
            cut what isn't. we help you tell the truth, better.
          </p>

          <p>
            we're not here to help you apply to more jobs. we're here to help you get the ones you
            want.
          </p>

          <p className="text-white font-medium">apply less. mean it more. get further.</p>

          <p className="text-payne-gray text-xs pt-4">— the resumemaxxing team</p>
        </div>
      </article>
    </main>
  )
}

export default ManifestoPage
