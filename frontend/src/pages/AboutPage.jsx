import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, Shield, Zap, Users, Star, MapPin, Film, Trophy,
  Headphones, ChevronDown, ChevronUp, Mail, Phone,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// ─── Sub-components ───────────────────────────────────────────────────────────
const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-2xl transition-all duration-200 overflow-hidden ${open ? 'border-brand bg-brand/5' : 'border-zinc-200 bg-white'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="text-sm font-bold text-zinc-800 pr-4">{q}</span>
        {open ? (
          <ChevronUp size={16} className="shrink-0 text-brand" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-zinc-400" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-zinc-600 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
          {a}
        </div>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const AboutPage = () => {
  const { t } = useLanguage();

  const stats = [
    { value: '1',    label: t('about.stat.cinemas'),    icon: <MapPin size={20} className="text-brand" /> },
    { value: '500K+', label: t('about.stat.customers'),  icon: <Users size={20} className="text-emerald-600" /> },
    { value: '10K+', label: t('about.stat.showtimes'),  icon: <Film size={20} className="text-sky-600" /> },
    { value: '4.8★', label: t('about.stat.rating'),     icon: <Star size={20} className="text-amber-500" /> },
  ];

  const values = [
    {
      icon: <Heart size={22} className="text-rose-600" />,
      bg: 'bg-rose-50 border-rose-200',
      title: t('about.values.passion.title'),
      desc:  t('about.values.passion.desc'),
    },
    {
      icon: <Shield size={22} className="text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-200',
      title: t('about.values.quality.title'),
      desc:  t('about.values.quality.desc'),
    },
    {
      icon: <Zap size={22} className="text-amber-600" />,
      bg: 'bg-amber-50 border-amber-200',
      title: t('about.values.tech.title'),
      desc:  t('about.values.tech.desc'),
    },
    {
      icon: <Headphones size={22} className="text-sky-600" />,
      bg: 'bg-sky-50 border-sky-200',
      title: t('about.values.service.title'),
      desc:  t('about.values.service.desc'),
    },
  ];

  const milestones = [
    { year: '2019', title: t('about.milestone.2019.title'), desc: t('about.milestone.2019.desc') },
    { year: '2020', title: t('about.milestone.2020.title'), desc: t('about.milestone.2020.desc') },
    { year: '2022', title: t('about.milestone.2022.title'), desc: t('about.milestone.2022.desc') },
    { year: '2023', title: t('about.milestone.2023.title'), desc: t('about.milestone.2023.desc') },
    { year: '2024', title: t('about.milestone.2024.title'), desc: t('about.milestone.2024.desc') },
  ];

  const team = [
    {
      name: 'Nguyễn Minh Tuấn',
      role: 'CEO & Co-founder',
      avatar: 'MT',
      avatarBg: 'from-brand-dark to-brand text-zinc-950',
      quote: t('about.team.quote.ceo'),
    },
    {
      name: 'Trần Thị Lan Anh',
      role: 'COO & Co-founder',
      avatar: 'LA',
      avatarBg: 'from-sky-600 to-sky-400 text-white',
      quote: t('about.team.quote.coo'),
    },
    {
      name: 'Lê Hoàng Phúc',
      role: 'CTO',
      avatar: 'HP',
      avatarBg: 'from-emerald-600 to-emerald-400 text-white',
      quote: t('about.team.quote.cto'),
    },
    {
      name: 'Phạm Quỳnh Anh',
      role: 'Head of Experience',
      avatar: 'QA',
      avatarBg: 'from-rose-600 to-rose-400 text-white',
      quote: t('about.team.quote.hoe'),
    },
  ];

  const faqs = [
    { q: t('about.faq.q1'), a: t('about.faq.a1') },
    { q: t('about.faq.q2'), a: t('about.faq.a2') },
    { q: t('about.faq.q3'), a: t('about.faq.a3') },
    { q: t('about.faq.q4'), a: t('about.faq.a4') },
    { q: t('about.faq.q5'), a: t('about.faq.a5') },
  ];

  return (
    <div className="space-y-16 pb-16">

      {/* ── Hero ── */}
      <div className="relative rounded-3xl overflow-hidden border border-zinc-200 bg-white text-center py-16 px-8 md:px-20 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,208,104,0.12),transparent_70%)] pointer-events-none" />
        {/* Decorative dots */}
        <div className="absolute top-6 left-6 w-2 h-2 rounded-full bg-brand/40 animate-pulse" />
        <div className="absolute top-10 right-10 w-1.5 h-1.5 rounded-full bg-brand/30 animate-pulse delay-300" />
        <div className="absolute bottom-6 left-16 w-1 h-1 rounded-full bg-brand/20 animate-pulse delay-700" />

        <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand/15 border border-brand/30 text-zinc-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
            <Heart size={12} className="text-brand" />
            {t('about.badge')}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-zinc-900 leading-tight">
            {t('about.hero.title')} <span className="text-brand">Nova Cinema</span>
          </h1>
          <p className="text-zinc-600 text-sm md:text-base leading-relaxed font-medium">
            {t('about.hero.desc')}
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              to="/movies"
              className="bg-[#f4d068] hover:bg-[#f3c647] text-zinc-950 text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-[#f4d068]/20 active:scale-95"
            >
              {t('about.hero.exploreMovies')}
            </Link>
            <Link
              to="/theaters"
              className="bg-zinc-100 border border-zinc-200 text-zinc-700 hover:text-zinc-950 text-sm font-bold px-6 py-2.5 rounded-xl transition-all active:scale-95"
            >
              {t('about.hero.findTheater')}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col items-center gap-2 text-center hover:border-brand/40 transition-colors shadow-sm">
            {s.icon}
            <span className="text-3xl font-black text-zinc-900">{s.value}</span>
            <span className="text-xs text-zinc-500 font-medium leading-tight">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Mission ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pb-12 md:pb-20 border-b border-zinc-100">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 text-zinc-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            <Trophy size={11} className="text-brand" /> {t('about.mission.badge')}
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 leading-tight">
            {t('about.mission.title1')}<br />
            <span className="text-brand">{t('about.mission.title2')}</span>
          </h2>
          <p className="text-zinc-600 text-sm leading-relaxed font-medium">
            {t('about.mission.desc1')}
          </p>
          <p className="text-zinc-500 text-sm leading-relaxed font-medium">
            {t('about.mission.desc2')}
          </p>
        </div>

        {/* Visual collage */}
        <div className="grid grid-cols-2 gap-3 h-64 md:h-80">
          <div className="rounded-2xl overflow-hidden bg-white border border-zinc-200 h-full">
            <img
              src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80"
              alt="Cinema"
              className="w-full h-full object-cover opacity-90"
            />
          </div>
          <div className="flex flex-col gap-3 h-full justify-between">
            <div className="rounded-2xl overflow-hidden bg-white border border-zinc-200 h-[47%]">
              <img
                src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&auto=format&fit=crop&q=80"
                alt="IMAX"
                className="w-full h-full object-cover opacity-90"
              />
            </div>
            <div className="rounded-2xl overflow-hidden bg-white border border-zinc-200 h-[47%]">
              <img
                src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=80"
                alt="Seats"
                className="w-full h-full object-cover opacity-90"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Core Values ── */}
      <div className="space-y-6 pt-16 md:pt-24">
        <div className="text-center">
          <h2 className="text-2xl font-black text-zinc-900">{t('about.values.title')}</h2>
          <p className="text-zinc-500 text-sm mt-1">{t('about.values.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {values.map((v, i) => (
            <div key={i} className={`bg-white border ${v.bg} rounded-2xl p-5 space-y-3 hover:scale-[1.02] transition-transform duration-200 shadow-sm`}>
              <div className="w-10 h-10 rounded-xl border flex items-center justify-center bg-white shadow-sm">
                {v.icon}
              </div>
              <h3 className="font-black text-zinc-800 text-sm">{v.title}</h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-medium">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-black text-zinc-900">{t('about.faq.title')}</h2>
          <p className="text-zinc-500 text-sm mt-1">{t('about.faq.subtitle')}</p>
        </div>
        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>

      {/* ── Contact CTA ── */}
      <div className="bg-gradient-to-br from-brand/10 via-white to-zinc-50 border border-brand/20 rounded-3xl p-8 md:p-12 text-center space-y-5 shadow-sm">
        <h2 className="text-2xl md:text-3xl font-black text-zinc-900">{t('about.contact.title')}</h2>
        <p className="text-zinc-600 text-sm max-w-md mx-auto leading-relaxed font-medium">
          {t('about.contact.desc')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="mailto:support@novacinema.vn"
            className="flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-950 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <Mail size={15} className="text-brand" />
            support@novacinema.vn
          </a>
          <a
            href="tel:19009090"
            className="flex items-center gap-2 bg-[#f4d068] hover:bg-[#f3c647] text-zinc-950 text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-[#f4d068]/20"
          >
            <Phone size={15} />
            Hotline: 1900 9090
          </a>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;