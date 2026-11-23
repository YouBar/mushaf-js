---
title: Preface
description: A word before we begin.
---

<p class="bismillah" lang="ar" dir="rtl">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</p>

# Preface

**Assalamu alaikum wa rahmatullahi wa barakatuh.**

All praise belongs to Allah ﷻ, Lord of the worlds, and may His peace and blessings be upon our Prophet Muhammad ﷺ, his family and his companions.

Before anything else, we thank Allah ﷻ for giving us the ability and the time to build something that may, in sha Allah, benefit the Ummah. Whatever good is in this work is from Allah ﷻ alone. Any shortcomings are our own.

## Why mushaf.js exists

The Prophet ﷺ said:

> <span lang="ar" dir="rtl">خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ</span>
>
> "The best of you are those who learn the Qur'an and teach it."
>
> Sahih al-Bukhari, 5027

Many students learn and memorise the Qur'an from the printed Madinah Mushaf. They know where an ayah sits on the page, which line it starts on and how the page looks. Apps that help them should show the Mushaf exactly like that, not as reflowed text.

mushaf.js was made for that: to put the Mushaf, page for page and line for line, into any web app, and to let developers build on top of it. Tracking hifz, assigning lessons, marking mistakes, following a recitation, bookmarking an ayah. It started as part of an app for Qur'an memorisation and is shared openly so others can use it too.

## Our intention

We ask Allah ﷻ to make this work sincerely for His sake, to accept it from us, and to make it a sadaqah jariyah for everyone who contributed to it, and for the teachers and students who use what is built with it.

## With thanks

This project stands on the work of others. Jazahum Allahu khayran to:

- **[QUL — Quranic Universal Library](https://qul.tarteel.ai/)** by Tarteel, for the Mushaf layout, glyph data, text and metadata that every page here is built from.
- **The King Fahd Glorious Qur'an Printing Complex** in Madinah, for the Mushaf itself and the QPC fonts that reproduce its calligraphy.
- The authors of **qcf_quran_plus**, whose rendering this library takes as its visual reference.
- Everyone who reports an issue, suggests an improvement or contributes code.

## A request

The text of the Qur'an is an amanah. We have done our best to render every page faithfully, but we are human. If you find a mistake in a word, an ayah, a page or a marker, please [report it on GitHub](https://github.com/YouBar/mushaf-js/issues) so it can be corrected.

And please remember us, our families and everyone who worked on this in your du'a.

<p class="closing" lang="ar" dir="rtl">وَآخِرُ دَعْوَانَا أَنِ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ</p>

<p class="closing-en">And our final prayer is that all praise belongs to Allah ﷻ, Lord of the worlds.</p>

<div class="next">

[Continue to the introduction →](/introduction)

</div>

<style>
.bismillah {
  margin: 8px 0 28px;
  text-align: center;
  font-family: 'Amiri Quran', 'Amiri', 'Noto Naskh Arabic', 'Geeza Pro', serif;
  font-size: 30px;
  line-height: 2;
  color: var(--vp-c-text-1);
}
.vp-doc blockquote span[lang='ar'],
.closing {
  font-family: 'Amiri Quran', 'Amiri', 'Noto Naskh Arabic', 'Geeza Pro', serif;
  font-size: 22px;
  line-height: 2;
}
.vp-doc blockquote span[lang='ar'] { display: block; text-align: right; }
.closing { margin: 32px 0 4px; text-align: center; }
.closing-en { margin-top: 0; text-align: center; color: var(--vp-c-text-2); font-size: 14px; }
.next { margin-top: 32px; }
</style>
