# Changelog

All notable changes to Taily are documented here.

## [0.8.1](https://github.com/ulbrich-media/taily/compare/v0.8.0...v0.8.1) (2026-07-14)


### Bug Fixes

* sort people and animals lists by creation date descending ([#109](https://github.com/ulbrich-media/taily/issues/109)) ([d2ff9dc](https://github.com/ulbrich-media/taily/commit/d2ff9dcc702ed96a7c4a2b20cc6d33cb9596daa2))

# [0.8.0](https://github.com/ulbrich-media/taily/compare/v0.7.2...v0.8.0) (2026-07-13)


### Bug Fixes

* account security hardening for remember-me, invitations and user list ([#106](https://github.com/ulbrich-media/taily/issues/106)) ([0166d94](https://github.com/ulbrich-media/taily/commit/0166d9429fed7b20f7a122e2f08e14af8acddea8))
* profile page stripped of unused functionality ([#107](https://github.com/ulbrich-media/taily/issues/107)) ([869f5b1](https://github.com/ulbrich-media/taily/commit/869f5b13a5acc3f960b61b899aab5c2e90d0c6d7))
* security page layout and wording improved ([182d23c](https://github.com/ulbrich-media/taily/commit/182d23cc6d3fb3d7fbfe419350e9e3d011c7f0f7))


### Features

* "Stay logged in" checkbox added to login ([#103](https://github.com/ulbrich-media/taily/issues/103)) ([df29678](https://github.com/ulbrich-media/taily/commit/df29678f0f02d84b85728c48da3679114d85cb6d))
* 2FA status and account creation date added to user list ([#96](https://github.com/ulbrich-media/taily/issues/96)) ([c2ebabe](https://github.com/ulbrich-media/taily/commit/c2ebabe70b574439fcbfd44299ae3d356190a202))
* active sessions management added ([#108](https://github.com/ulbrich-media/taily/issues/108)) ([0f2e40d](https://github.com/ulbrich-media/taily/commit/0f2e40de0881d094957bb93294f106575f1cd92d))
* migrate authentication to Laravel Fortify; includes password change and reset ([#92](https://github.com/ulbrich-media/taily/issues/92)) ([571f14a](https://github.com/ulbrich-media/taily/commit/571f14ab6a6448bd022656c8136f47dffe48cf1a))
* passkey (WebAuthn) authentication added ([#99](https://github.com/ulbrich-media/taily/issues/99)) ([abffe3a](https://github.com/ulbrich-media/taily/commit/abffe3ab0afecd047b98a915f181e7feb8f4c755))
* security settings consolidated into one security page ([#95](https://github.com/ulbrich-media/taily/issues/95)) ([b45f14b](https://github.com/ulbrich-media/taily/commit/b45f14b5bc105caf2de2648ed3c3c92855dcc6fd))
* send security notification emails for account changes ([#105](https://github.com/ulbrich-media/taily/issues/105)) ([0e05523](https://github.com/ulbrich-media/taily/commit/0e055231b867a9abd556c6afcc6a1195b70a0526))
* status flags and inspection list improved  ([#87](https://github.com/ulbrich-media/taily/issues/87)) ([0cebed3](https://github.com/ulbrich-media/taily/commit/0cebed33e3c9f33e64ecf486d897833256a4ea14))
* taily-branded mail templates added ([#104](https://github.com/ulbrich-media/taily/issues/104)) ([f26411c](https://github.com/ulbrich-media/taily/commit/f26411c82f0c248f0df0c40ff6384a4f827773d6))
* two-factor authentication (TOTP) added ([#94](https://github.com/ulbrich-media/taily/issues/94)) ([622c0c8](https://github.com/ulbrich-media/taily/commit/622c0c85ffafa12af04d2c20dac3ba705d561133))

## [0.7.2](https://github.com/ulbrich-media/taily/compare/v0.7.1...v0.7.2) (2026-07-09)


### Bug Fixes

* frontend env issues resolved ([32cd32f](https://github.com/ulbrich-media/taily/commit/32cd32f00ea59cf844ed24614cd40f121ee6bad3))
* service provider registration enabled ([d87cceb](https://github.com/ulbrich-media/taily/commit/d87cceb56baa08ce662035522a6482e9e7c93d98))

## [0.7.1](https://github.com/ulbrich-media/taily/compare/v0.7.0...v0.7.1) (2026-06-27)


### Bug Fixes

* missing media library registration added ([057c16c](https://github.com/ulbrich-media/taily/commit/057c16c2bdfa5fbf1394c7b9f12f2f9f882c4271))

# [0.7.0](https://github.com/ulbrich-media/taily/compare/v0.6.0...v0.7.0) (2026-06-27)


### Bug Fixes

* missing filesystem registration added ([9b7014f](https://github.com/ulbrich-media/taily/commit/9b7014fdffdf2beef720634fefd65fa0ef19be4a))


### Features

* dynamic page titles added ([#79](https://github.com/ulbrich-media/taily/issues/79)) ([7b99cbe](https://github.com/ulbrich-media/taily/commit/7b99cbe4e9964a64dc76c357d321cc2a9faa95e6))
* form detail page rebuild ([#74](https://github.com/ulbrich-media/taily/issues/74)) ([060fc41](https://github.com/ulbrich-media/taily/commit/060fc41fb094660b6f727734593b5c7b32a0d576))

# [0.6.0](https://github.com/ulbrich-media/taily/compare/v0.5.0...v0.6.0) (2026-06-21)


### Bug Fixes

* pre inspection pages moved into person detail page ([#72](https://github.com/ulbrich-media/taily/issues/72)) ([ce8d656](https://github.com/ulbrich-media/taily/commit/ce8d6561e8958e46bcf48b2c113aaa1f79bdfdbb))
* redesign issues resolved ([#70](https://github.com/ulbrich-media/taily/issues/70)) ([296f46e](https://github.com/ulbrich-media/taily/commit/296f46e67a11bfa946400e0f76d9547524f1c137))


### Features

* dynamic form handling for pre-inspections implemented ([#56](https://github.com/ulbrich-media/taily/issues/56)) ([dcbc956](https://github.com/ulbrich-media/taily/commit/dcbc95668bd2586adb9c9314be5ed6ccce1980c1))
* headline markers added and headlines synced ([#69](https://github.com/ulbrich-media/taily/issues/69)) ([c0ef9f4](https://github.com/ulbrich-media/taily/commit/c0ef9f4b3e875e9fd43479e2dd7a3ca64f84dc85))

# [0.5.0](https://github.com/ulbrich-media/taily/compare/v0.4.0...v0.5.0) (2026-06-20)


### Bug Fixes

* lazy loading enabled for images ([#63](https://github.com/ulbrich-media/taily/issues/63)) ([c17fecf](https://github.com/ulbrich-media/taily/commit/c17fecf86f9a1835bbfeeba66e2e82d1d9893614))


### Features

* transport management for animal adoptions implemented ([#54](https://github.com/ulbrich-media/taily/issues/54)) ([4ffa1fc](https://github.com/ulbrich-media/taily/commit/4ffa1fc742c0fdc8830058685cf59f0a93ee2ca7))
* **ui:** alert dialog enforced ([#62](https://github.com/ulbrich-media/taily/issues/62)) ([ca1e6d7](https://github.com/ulbrich-media/taily/commit/ca1e6d780d8b688a3628e54534f71b316d30bef7))
* **ui:** breadcrumbs implemented ([#61](https://github.com/ulbrich-media/taily/issues/61)) ([a812edc](https://github.com/ulbrich-media/taily/commit/a812edc7b26cc1b189a0a800aa0d7ff226d2cee9))
* **ui:** redesign implemented ([#60](https://github.com/ulbrich-media/taily/issues/60)) ([e30712d](https://github.com/ulbrich-media/taily/commit/e30712dee4945ef9835757fffe255fe7fba90469))

# [0.4.0](https://github.com/ulbrich-media/taily/compare/v0.3.0...v0.4.0) (2026-05-28)


### Features

* contract file management added to adoption ([#39](https://github.com/ulbrich-media/taily/issues/39)) ([bf24e8e](https://github.com/ulbrich-media/taily/commit/bf24e8ea980f18790d886ed4758eb8b1fdeda054))

# [0.3.0](https://github.com/ulbrich-media/taily/compare/v0.2.1...v0.3.0) (2026-05-14)


### Bug Fixes

* single checkbox removed in favour of switch  ([#37](https://github.com/ulbrich-media/taily/issues/37)) ([23e5f8d](https://github.com/ulbrich-media/taily/commit/23e5f8d5999597bf6e9ba5a77b2b42de04f03727))
* some animal fields moved and renamed ([#36](https://github.com/ulbrich-media/taily/issues/36)) ([b4b48c6](https://github.com/ulbrich-media/taily/commit/b4b48c6e57baa4dc1f254f2b76b4f732f9aa0e6b))
* token trait issues resolved ([#32](https://github.com/ulbrich-media/taily/issues/32)) ([772c0f5](https://github.com/ulbrich-media/taily/commit/772c0f51879f4443a40603cbc34725a7c70c357d))


### Features

* adoption process to use status-based workflow ([#33](https://github.com/ulbrich-media/taily/issues/33)) ([e12d144](https://github.com/ulbrich-media/taily/commit/e12d1447a837f05dda61957937e2c1da1257ae4f))

## [0.2.1](https://github.com/ulbrich-media/taily/compare/v0.2.0...v0.2.1) (2026-05-03)


### Bug Fixes

* broken organization links fixed ([e1c60f1](https://github.com/ulbrich-media/taily/commit/e1c60f1c4c7c5ed5c7e3209b25b2b4f037cd63f0))

# [0.2.0](https://github.com/ulbrich-media/taily/compare/v0.1.3...v0.2.0) (2026-05-03)


### Bug Fixes

* profile picture handling fixed ([f446554](https://github.com/ulbrich-media/taily/commit/f446554815b074c3bf9d238ff731e63579e7d30d))
* public api updated to match current animal structure; public media added ([#27](https://github.com/ulbrich-media/taily/issues/27)) ([e2e6a12](https://github.com/ulbrich-media/taily/commit/e2e6a12c11ea6020fc2f31f3f57d5b906d7ba7aa))
* **ui:** avatars unified ([987a063](https://github.com/ulbrich-media/taily/commit/987a0632e50451d466b5e1ae2109d7bc20f0f8a1))


### Features

* animal trait fields added for compatibility and personality traits ([#22](https://github.com/ulbrich-media/taily/issues/22)) ([aef757a](https://github.com/ulbrich-media/taily/commit/aef757af47c47e8a8a83de950a8247381144022c))
* animal weight, size, and publication fields added ([#21](https://github.com/ulbrich-media/taily/issues/21)) ([4c10739](https://github.com/ulbrich-media/taily/commit/4c107396c75eff9caf5e1a9da0407c4c10601088))
* health conditions removed in favour of separate vaccinations and medical tests ([#13](https://github.com/ulbrich-media/taily/issues/13)) ([fb2924e](https://github.com/ulbrich-media/taily/commit/fb2924ee5f9541ff9a9821a854a28d9f06a7e5c5)), closes [#12](https://github.com/ulbrich-media/taily/issues/12)
* lightbox added to media gallery ([#24](https://github.com/ulbrich-media/taily/issues/24)) ([d846ebd](https://github.com/ulbrich-media/taily/commit/d846ebd75acd9ed291bd36d20f5eb4f58cb908b1))
* static OpenAPI spec file added ([#26](https://github.com/ulbrich-media/taily/issues/26)) ([8f90e1f](https://github.com/ulbrich-media/taily/commit/8f90e1fcbd2cc6df67184aad7495aec9c64843a1))
* video support added to animal media gallery ([#14](https://github.com/ulbrich-media/taily/issues/14)) ([67994ee](https://github.com/ulbrich-media/taily/commit/67994ee80c71ef684f84dae1c25cad5e12bc9dc2))

## [0.1.3](https://github.com/ulbrich-media/taily/compare/v0.1.2...v0.1.3) (2026-04-20)


### Bug Fixes

* namespace and provider issues resolved ([#10](https://github.com/ulbrich-media/taily/issues/10)) ([2cbce5f](https://github.com/ulbrich-media/taily/commit/2cbce5fed5f5797e95229b69ddc81bac9e9db318))

## [0.1.2](https://github.com/ulbrich-media/taily/compare/v0.1.1...v0.1.2) (2026-04-19)


### Bug Fixes

* hardcoded ddev url removed ([ddaa5cf](https://github.com/ulbrich-media/taily/commit/ddaa5cfa3322146ce1f305d6dc50b67a65e36337))

## [0.1.1](https://github.com/ulbrich-media/taily/compare/v0.1.0...v0.1.1) (2026-04-19)


### Bug Fixes

* release asset target fixed ([e730e4f](https://github.com/ulbrich-media/taily/commit/e730e4fb56703fd670586236237eb80b3b67004a))

# [0.1.0](https://github.com/ulbrich-media/taily/compare/v0.0.0...v0.1.0) (2026-04-19)


### Features

* initial project setup ([1dab170](https://github.com/ulbrich-media/taily/commit/1dab170f8b4e6d2e4fd1b5889fde35bb57c3056e))
