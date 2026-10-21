# Text provenance and review scope

The English document is the reference text. This project provides no commentary
or legal interpretation.

## Sources

- English Articles I–VII and signatures: [National Archives transcription](https://www.archives.gov/founding-docs/constitution-transcript).
- English amendments: [National Constitution Center full text](https://constitutioncenter.org/the-constitution/full-text).
- Spanish text: [National Archives, La Constitución de los Estados Unidos de América](https://www.archives.gov/espanol/constitucion),
  including amendments (page last reviewed by NARA March 3, 2022; copied October 2026).

## Spanish text (October 2026)

The Spanish passages are the National Archives translation, copied verbatim,
including its typos and garbled characters (for example "tendra", and
"varme la remuneracisn" in Amendment XXVII), the same way the English text
keeps the original spelling. Section numerals such as "2." are kept as NARA
prints them. Headings, subtitles, labels and other interface text are the
site's own writing.

Passage boundaries follow the English structure, which the build validates:

| Passage | Handling |
| --- | --- |
| Amendment XII | NARA's 3 paragraphs joined into 1 passage |
| Amendment XXIII §1, Amendment XXV §4 | NARA's 2 paragraphs joined into 1 passage each |
| Article VII dating line | NARA's "Dado en la convención…"; it has no "In witness whereof" clause |
| Article II §1 cl. 3, Article VII interlineation note, "Attest William Jackson" | Not on the NARA page; the earlier Spanish text is kept |
| Signatures | Not on the NARA page; names stay in their original English form |

NARA does not name the translator. Ratification dates in NARA's amendment
headings and its Bill of Rights note are not copied into passage text; the
English data carries neither.

This replaces the September 2026 adaptation and its three spot corrections
(Preamble, Article I §3, Amendment VI). Earlier attribution to State Department
and USCIS materials was removed in September and is not restored.

`node tests/build-regressions.cjs` checks the NARA Spanish text, all 27 amendment
years, source links and output anchors. The build checks matching article/section
IDs, paragraph counts, amendment numbers and years across locales. Those checks
establish structural parity, not semantic equivalence.

## Citation date convention

BibTeX uses 1787 (signing year) for the original document and the amendment's
ratification year from `data/constitution*.js` for amendments. The year is omitted
if amendment metadata cannot be resolved; it never silently substitutes 1787.
The existing XIX paragraph/section convention remains unchanged. English
Commerce Clause output remains `U.S. Const. art. I, § 8, cl. 3`.

## Modification metadata

Sitemaps contain the three canonical pages per locale. Passage fragments stay
available for readers but are not separate sitemap URLs. Optional `lastmod` and
`dateModified` are omitted because a build date does not establish a content
change. The original publication date remains 1787-09-17.
