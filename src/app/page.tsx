import { redirect } from "next/navigation"
import { auth } from "@/auth"
import Link from "next/link"
import { LoginButton } from "@/components/LoginButton"

export default async function HomePage() {
  const session = await auth()
  
  if (session) {
    if (session.user.role === "TEACHER") {
      redirect("/teacher/dashboard")
    }
    if (!session.user.role) {
      redirect("/role-select")
    }
    redirect("/student/assignments")
  }
  
  return (
    <div className="font-display bg-background-warm text-[#2d2a2e] transition-colors duration-300 w-full min-h-screen">
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-content-border px-6 md:px-12 py-4">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2 text-primary">
              <div className="size-7">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z" fill="currentColor"></path>
                </svg>
              </div>
              <h2 className="text-[#1a1a1a] text-lg font-bold tracking-tighter uppercase italic">EngMaster</h2>
            </div>
            <nav className="hidden md:flex items-center gap-8 border-l border-content-border pl-10">
              <Link className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors" href="#">Marketplace</Link>
              <Link className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors" href="#">Teachers</Link>
              <Link className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors" href="#">Pricing</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <LoginButton className="text-xs font-bold uppercase tracking-widest px-4 py-2 hover:bg-black/5 rounded transition-all">Log In</LoginButton>
            <LoginButton className="bg-primary text-white text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded shadow-sm hover:bg-primary-dark transition-all">Get Started</LoginButton>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto">
        <section className="px-6 pt-10 pb-16">
          <div className="bg-magazine-green hero-rounded p-12 md:p-20 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden">
            <div className="max-w-xl relative z-10">
              <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-white text-[10px] font-bold uppercase tracking-widest mb-6">Community Marketplace</span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                Master English through <br/><span className="text-yellow-400">Community.</span>
              </h1>
              <p className="text-lg text-white/90 leading-relaxed max-w-md font-medium mb-8">
                Step into a vibrant marketplace where expert teachers share real-world English through interactive lessons and live content.
              </p>
              <div className="flex flex-wrap gap-4">
                <LoginButton className="px-8 py-3 bg-white text-magazine-green text-sm font-bold uppercase tracking-widest rounded-full shadow-lg hover:bg-gray-100 transition-all inline-block">
                  Start Learning
                </LoginButton>
                <LoginButton className="px-8 py-3 bg-transparent border border-white/40 text-white text-sm font-bold uppercase tracking-widest rounded-full hover:bg-white/10 transition-all inline-block">
                  Become a Teacher
                </LoginButton>
              </div>
            </div>
            <div className="relative w-full max-w-md md:w-1/2 flex justify-center items-center">
              <div className="relative">
                <div className="size-64 md:size-80 lg:size-96 rounded-full overflow-hidden border-8 border-white/10 shadow-2xl">
                  <img alt="Students" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCas9yvkj1JGW018DJcDUzbf-fO8TqYncBo0W-FthkHXoblEHypv9OrHwT3NeIFnEfXnoXZWEWh_72rG7nj9Z_y815bh1GW-3ngW5Ns-rm-zeWpL4Imkg_b60KyPXjdeHABj1QHvyznXYkBvdPnL7gBMylWN_8gyyW8ACgxGhaeRzhnkg4be6AmOJgFxoKb-y_QNei_wFyStdYHIY2knC3bdk7KGbyaOHyboMGkihvn4GY1dxoy6D_2AJjty9a-QgXXfjX3_Iby3pY"/>
                </div>
                <div className="absolute -top-4 -right-4 bg-yellow-400 p-4 rounded-xl shadow-xl rotate-12 flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-magazine-green">campaign</span>
                  <span className="text-[10px] font-extrabold uppercase text-magazine-green whitespace-nowrap">Live Lessons</span>
                </div>
                <div className="absolute -bottom-2 -left-8 bg-white p-4 rounded-xl shadow-xl -rotate-6 flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-primary">verified_user</span>
                  <span className="text-[10px] font-extrabold uppercase text-[#1a1a1a] whitespace-nowrap">Top Experts</span>
                </div>
              </div>
            </div>
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }}></div>
          </div>
        </section>

        <section className="px-6 mb-8">
          <div className="flex flex-wrap justify-center gap-8 py-6 border-y border-content-border/50">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-primary">10k+</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#756189]">Active Learners</span>
            </div>
            <div className="flex items-center gap-3 border-l border-content-border pl-8">
              <span className="text-2xl font-bold text-primary">500+</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#756189]">Certified Teachers</span>
            </div>
            <div className="flex items-center gap-3 border-l border-content-border pl-8">
              <span className="text-2xl font-bold text-primary">2.5k+</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#756189]">Premium Lessons</span>
            </div>
          </div>
        </section>

        <section className="px-6 mb-16">
          <div className="max-w-5xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-primary/60 group-focus-within:text-primary transition-colors text-2xl">search</span>
              </div>
              <input className="w-full h-20 pl-20 pr-40 bg-white border border-content-border rounded-full text-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary search-shadow transition-all placeholder:text-[#756189]/40 font-medium" placeholder="Search for lessons, topics, or teachers..." type="text"/>
              <div className="absolute inset-y-3 right-3">
                <button className="h-full px-12 bg-primary text-white text-sm font-bold uppercase tracking-widest rounded-full hover:bg-primary-dark shadow-md transition-all">Search</button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 overflow-hidden">
          <div className="px-6 mb-8 flex items-end justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent mb-1 block">Editor&apos;s Choice</span>
              <h3 className="text-3xl font-bold italic tracking-tight text-[#1a1a1a]">Featured Lessons</h3>
            </div>
          </div>
          <div className="flex overflow-x-auto no-scrollbar gap-8 px-6 pb-8">
            <div className="min-w-[340px] md:min-w-[420px] bg-white border border-content-border rounded-xl overflow-hidden flex flex-col magazine-shadow group cursor-pointer transition-transform hover:-translate-y-1">
              <div className="h-56 overflow-hidden">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1kKAOdKkPQSlS_Y6zmo_zvjWD2w5oIDsdw7jn3vc0cAa4I94qVUQndnX1M03jgkFe_VIsidimZW0868pwMOJt88Jsfybj_wJ9x92s_fyrYfvak0D8zPeaIpLNDNJWOgrmB1l_oBpj8PtEAbTs1oQBH9umc_iyBt_hbGTZ5FrKBcYe7SPXKkX7sMeC-6KTI22KRiEXsYT3mN9OiSeu8KiC4H9cq0HySnypF3517tdjCl6mjt4hnXrQH4DN3uuVQF1gmOC-pgGMrUJA"/>
              </div>
              <div className="p-8">
                <span className="text-[10px] font-bold text-primary uppercase border border-primary/20 px-3 py-1 rounded-full bg-primary-light">Intermediate</span>
                <h4 className="mt-4 text-xl font-bold leading-tight group-hover:text-primary transition-colors">Business English for Startup Founders</h4>
                <p className="text-sm text-[#756189] mt-3 line-clamp-2">Master pitches, negotiation, and professional networking with industry terms.</p>
              </div>
            </div>
            <div className="min-w-[340px] md:min-w-[420px] bg-white border border-content-border rounded-xl overflow-hidden flex flex-col magazine-shadow group cursor-pointer transition-transform hover:-translate-y-1">
              <div className="h-56 overflow-hidden">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8WyZBcHHTHbuHqyZxzmlNRTr3IjNU68UvZKQGkuumQKaajSuMI8AVAbRnKYK0W8PtDR7BDK2XCppYguMFXccHYgF27spwpfAWEATmJhn7kHCTTNovFC9kGpvzmLry1Q8RhABTe3O0mB3F91zJHxn91fSClgtpL7d915fCXtnM8wJLc6bXQheA3_JGUFSuRMr7fVkEYOG8-0G9a1om0kuICQGxLKvfB3VbAp83GIthLb1hiTauwwaJTfgK8n1blu-MS3L1m8zomi46"/>
              </div>
              <div className="p-8">
                <span className="text-[10px] font-bold text-green-600 uppercase border border-green-600/20 px-3 py-1 rounded-full bg-green-50">Beginner</span>
                <h4 className="mt-4 text-xl font-bold leading-tight group-hover:text-primary transition-colors">English Pronunciation Mastery</h4>
                <p className="text-sm text-[#756189] mt-3 line-clamp-2">The ultimate guide to accent reduction and clear communication for any speaker.</p>
              </div>
            </div>
            <div className="min-w-[340px] md:min-w-[420px] bg-white border border-content-border rounded-xl overflow-hidden flex flex-col magazine-shadow group cursor-pointer transition-transform hover:-translate-y-1">
              <div className="h-56 overflow-hidden">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBN0ks4DSRnK3xFz6fjNMemmAN6EVBzyBfF4yTWIe1Lre39EftI_mmPvzaQfSmxSEg3sBxHKctjQwtA2-WpI5tWXhP2NnHPLW9exeJRv3aFstZO3Egx4DR_o7VCO_1G-XRRWXWFWVsRiicBoMSGBihDfZIQ0nnPjZ0Q_pESFaf4-LTMsobjUXBK0gNSxSTq1wcga0Cf3geYoEoMLpl92i8x2wxKOsyzj8sErHVY95qsjeY4JWgkDCfa1vashimvSjtX5kdjORVOoyQ4"/>
              </div>
              <div className="p-8">
                <span className="text-[10px] font-bold text-red-600 uppercase border border-red-600/20 px-3 py-1 rounded-full bg-red-50">Advanced</span>
                <h4 className="mt-4 text-xl font-bold leading-tight group-hover:text-primary transition-colors">IELTS Preparation: Band 8+ Strategy</h4>
                <p className="text-sm text-[#756189] mt-3 line-clamp-2">Intensive training focusing on writing and speaking sections of the IELTS exam.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 bg-white border-y border-content-border/40">
          <div className="flex items-center justify-between mb-12">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent mb-1 block">Most Viewed</span>
              <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">Trending Lessons</h2>
            </div>
            <button className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2 hover:translate-x-1 transition-transform">
              Browse all <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <div className="group cursor-pointer">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 mb-6">
                <img alt="Business English" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_9EHDW-Ab2QkNA4InOD5po-wl_0sXLif7eq3lkBX8E7TB9dpOy4seuuiY07WywMRv_946BfLpzxRy2TP4gSCj98SI2qZHMANfAEau0HHlAGrxp4BK6Rb6cVRqy_x79whg8USQmFW2GQRtKhCT8dw9tczicHTvbkovpzNEq4eNfdgQCjRiKhfGOiZSksv67V6HWT0qOrH2FpNRB066lyCP4Na_7Cxsd2JUWA9Ew1pCQlXuyZfpkhqD69gnd6HEg9uWpz-8HBmXMTqg"/>
                <div className="absolute top-4 left-4">
                  <span className="bg-black/70 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full backdrop-blur-md">Featured</span>
                </div>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors leading-snug">Business English for Startup Founders</h3>
                  <div className="flex items-center gap-3">
                    <p className="text-[11px] font-bold text-[#756189] uppercase tracking-wider">Sarah Jenkins</p>
                    <span className="size-1 bg-content-border rounded-full"></span>
                    <p className="text-sm font-bold text-primary">$24.99</p>
                  </div>
                </div>
                <button className="size-10 shrink-0 rounded-full border border-content-border flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">play_arrow</span>
                </button>
              </div>
            </div>
            <div className="group cursor-pointer">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 mb-6">
                <img alt="Pronunciation" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlgUgdyq2L2XDPNrmM1TxuK-rLQrYIs-RSH5Onwl_-dPkDd-gbffpMss5u0pkB_fQmrjfKFQ1_Mfzueafk4MbWGn95MHXmLvx0fNdF9zlDVXulkfmHKX231yviS2L-zuL023J0-fyyuzvRLOO-ffeplxTA2P49F9o7yYOq7P0CMAeiMdCZrZB2JBpsnQyB3ex06a1sqi_dXFhlB0z5gUODVd1tLqpMzzRcImk6VT3F4mMdmLxqFKw-KIt48HKBAtoI19Jq8MEdmTOI"/>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors leading-snug">English Pronunciation Mastery</h3>
                  <div className="flex items-center gap-3">
                    <p className="text-[11px] font-bold text-[#756189] uppercase tracking-wider">Markus Chen</p>
                    <span className="size-1 bg-content-border rounded-full"></span>
                    <p className="text-sm font-bold text-primary">$19.00</p>
                  </div>
                </div>
                <button className="size-10 shrink-0 rounded-full border border-content-border flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">play_arrow</span>
                </button>
              </div>
            </div>
            <div className="group cursor-pointer">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 mb-6">
                <img alt="IELTS" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxCsUoetOHZZhF8MbBejWnSvjVodWA7e9oZuQK3BxJ5vg3_z57adRuC5jSNkahzS3WBUVv2e8_sGL5VcAj4bLx7BpEViWsDLSJ4UvGDFl4vANLx2SEVY-1Hvshtl78q2wbl-IR2uH2m-M3Tgw6j-Ty_w8vcJf9x5Po7V9MZW_6T7YwsIS4Ak-hTFg_MylyFpM5zogkJp8XJQyKCXzJJ4uxjU_bLugVF-oyQGvzxV0tRux5rd919KtZZQbuNdPNwO8dLk4Y6gljKe5b"/>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors leading-snug">IELTS Prep: Band 8+ Strategy</h3>
                  <div className="flex items-center gap-3">
                    <p className="text-[11px] font-bold text-[#756189] uppercase tracking-wider">Dr. Elena Rostova</p>
                    <span className="size-1 bg-content-border rounded-full"></span>
                    <p className="text-sm font-bold text-primary">$45.00</p>
                  </div>
                </div>
                <button className="size-10 shrink-0 rounded-full border border-content-border flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">play_arrow</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-4 flex flex-col gap-8">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent mb-2 block">Contributors</span>
                <h2 className="text-4xl font-extrabold text-[#1a1a1a] leading-tight">Why Teach on EngMaster?</h2>
              </div>
              <p className="text-[#5a565c] text-lg leading-relaxed font-medium">Empowering English educators with the tools to build their own brand, content, and revenue streams.</p>
              <button className="w-fit text-xs font-bold uppercase tracking-widest border-b-2 border-primary pb-2 hover:text-primary transition-colors">Apply to teach</button>
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="p-10 bg-white border border-content-border rounded-2xl magazine-shadow hover:border-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary text-4xl mb-6">record_voice_over</span>
                <h3 className="text-xl font-bold mb-3">Teach Your Way</h3>
                <p className="text-sm text-[#756189] leading-relaxed">No rigid curriculum. Share your unique teaching style, niche knowledge, and cultural insights.</p>
              </div>
              <div className="p-10 bg-white border border-content-border rounded-2xl magazine-shadow hover:border-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary text-4xl mb-6">payments</span>
                <h3 className="text-xl font-bold mb-3">Unlimited Earnings</h3>
                <p className="text-sm text-[#756189] leading-relaxed">Monetize video courses, live sessions, and downloadable resources. You set your prices.</p>
              </div>
              <div className="p-10 bg-white border border-content-border rounded-2xl magazine-shadow hover:border-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary text-4xl mb-6">volunteer_activism</span>
                <h3 className="text-xl font-bold mb-3">Inspire Global Growth</h3>
                <p className="text-sm text-[#756189] leading-relaxed">Join a community of thousands. Impact lives across borders while building your professional reputation.</p>
              </div>
              <div className="p-10 bg-primary-light border border-primary/10 rounded-2xl flex flex-col justify-center text-center">
                <p className="text-primary font-extrabold text-4xl tracking-tighter mb-1">50,000+</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Users in the community</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="bg-primary-light rounded-3xl p-12 md:p-20 text-center flex flex-col items-center gap-10 relative overflow-hidden border border-primary/10">
            <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #458e8e 1px, transparent 0)", backgroundSize: "24px 24px" }}></div>
            <div className="relative z-10 space-y-4">
              <h2 className="text-primary-dark text-4xl md:text-5xl font-extrabold tracking-tight max-w-3xl">Ready to transform your English?</h2>
              <p className="text-primary/80 font-medium">Join 50,000+ others today &bull; No credit card required</p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 relative z-10">
              <LoginButton className="h-14 px-12 bg-primary text-white font-bold text-sm uppercase tracking-widest rounded-full shadow-xl hover:bg-primary-dark transition-all flex items-center justify-center">
                Join as a Learner
              </LoginButton>
              <LoginButton className="h-14 px-12 bg-white border border-primary text-primary font-bold text-sm uppercase tracking-widest rounded-full hover:bg-primary-light transition-all flex items-center justify-center">
                Start Teaching
              </LoginButton>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-content-border py-16 px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2 text-[#1a1a1a]">
              <h2 className="text-xl font-bold tracking-tighter uppercase italic">EngMaster</h2>
            </div>
            <span className="text-[10px] text-[#756189] font-bold uppercase tracking-widest">&copy; 2024 Education First &bull; Modern EdTech</span>
          </div>
          <div className="flex gap-12">
            <Link className="text-[10px] font-bold uppercase tracking-widest text-[#756189] hover:text-primary" href="#">Terms</Link>
            <Link className="text-[10px] font-bold uppercase tracking-widest text-[#756189] hover:text-primary" href="#">Privacy</Link>
            <Link className="text-[10px] font-bold uppercase tracking-widest text-[#756189] hover:text-primary" href="#">Contact</Link>
          </div>
        </div>
      </footer>
      <div className="fixed bottom-8 right-8 z-[60]">
        <button className="size-14 rounded-full bg-accent text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform group">
          <span className="material-symbols-outlined text-2xl">mail</span>
          <span className="absolute right-full mr-4 bg-white border border-content-border text-[#1a1a1a] px-4 py-2 rounded shadow-sm text-[10px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Contact Editor</span>
        </button>
      </div>
    </div>
  )
}
