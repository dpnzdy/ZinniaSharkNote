# ZinniaShark Note Support Lifecycle and Updates Policy

Product name correction (2026-11-06): ZinniaShark Note was previously named Adequora Writer. This name correction does not change existing processing practices, terms of use or support policy.

Document version: 0.1 · Status: pre-release review draft
Effective date: [To be finalized before release: YYYY-MM-DD]

## 1. Licenses and support

A license is the right to run a version. Support is the scope of updates, issue investigation and inquiry handling provided. End of life (EOL) does not mean expiration of an acquired Free or Pro license. You may continue using an EOL version, but compatibility with new environments, security fixes and general technical support are not provided.

This policy applies to formal releases. Scope and end dates for development, private validation and public test editions are announced separately. Development version numbers in the current repository do not establish that formal 1.0 or 2.0 releases have occurred.

## 2. Support by version

| Version | Features and general bug fixes | Critical security/data-loss fixes | General technical support |
|---|---|---|---|
| Free / Pro of the latest formal major version | Provided in the latest maintenance release | Provided together in the same major version | Provided through announced support channels |
| Previous Pro major version after the next major release | New feature development ends; general fixes prioritize the latest version | Until 12 months after the next formal release | Installation, entitlement and existing-feature issues until EOL |
| Free 1.x edition | New feature development ends after 2.0 launches | Critical issues addressed until 6 months after 2.0 launches | Provided for the same 6-month transition period |
| EOL versions | Ended | Ended | General support ended; license evidence/restoration guidance operated separately |

Free and Pro have the same support period in versions such as 2.x where both coexist. Critical fixes for previous versions apply to shared code; security patches are not divided by Pro purchase status. Free can receive the same fixes while a previous version is maintained.

Support for the current major version continues if the next major release is delayed. Ending the entire product requires the separate process in Section 7. Support terms for versions already sold are not reduced retroactively.

## 3. EOL announcements and schedules

For previous paid major versions, the end date, impact and recommended migration path are announced at least 6 months before EOL. The condition that 1.x support ends 6 months after the formal 2.0 release is disclosed at the public 1.0 release, and the actual end date is confirmed at 2.0 release. Already promised support is not reduced without sufficient advance notice.

Announcements appear on the official product page and release notes and, where possible, in the app. Email is used only for recipients for whom there is a lawful basis to receive such notices.

| Version | Formal release date | Next major release date | End of critical fixes and general support |
|---|---|---|---|
| Windows 1.x | First public release November 3, 2026 | 2.0 release date undecided | 2.0 release date + 6 months |
| 2.x | Undecided; unreleased | 3.0 release date undecided | 3.0 release date + 12 months |
| 3.x and later | Entered when that version is released | Undecided | Next major release date + 12 months |

Actual date announcements specify year, month and day. If calculation produces a nonexistent date, the last day of that month is used and announced. Latest announcement URL: [To be finalized before release].

## 4. Support scope and limits

General support covers installation, launch, document work, feature use, reproducible errors and license restoration. Pro receives priority handling for purchase/entitlement issues, but response or completion times are not contractually guaranteed. Free users can also report security and data-loss issues.

| Item | Operating standard |
|---|---|
| Channel | dpnzdy@zinniashark.com |
| Hours and holidays | [To be finalized before release: include time zone] |
| First response target | [To be finalized before release: achievable business-day target] |
| Security reports | dpnzdy@zinniashark.com; ask how to transfer sensitive attachments first |
| Supported OS and architecture | Confirmed in each formal release's supported-environment table |

The Windows development edition currently targets validation on x64 Windows 10 22H2 and Windows 11. Whether the app can run is separate from Microsoft's OS, .NET and WebView2 support. The latest formal release specifies actually supported OS releases and runtimes; exclusions are announced 6 months in advance where possible. If urgent security reasons require a shorter transition, reasons and alternatives are explained.

Decryption, complete recovery of damaged files, resolution of every third-party synchronization/plugin/hardware issue and unsupported file conversions are not guaranteed. Critical issues are addressed with patches, workarounds or guidance to the latest safe version according to risk and reproduction results; no arbitrary fixed fix deadline is promised before release.

Security/data-loss reports should use minimum reproduction materials instead of original documents or passwords. Support inquiry information is handled under the [Privacy Policy](PRIVACY-POLICY.md).

## 5. Updates within the same major version

Updates offered during the purchased major version's support period, such as 2.0 → 2.1 → 2.x, carry no additional license charge. This does not guarantee development of every future feature or a specific update frequency.

Release notes describe changes, supported environments and known issues. Store editions use Store update channels; direct distribution editions use official packages. The app is not described as implementing its own automatic updates for every installation method.

Save documents and close the app before updating. Updates retaining the same app/package identity are designed and verified to preserve settings and working data, while users are advised not to rely solely on internal data as their only backup.

## 6. Major version upgrade process

A paying customer's 2.x Pro is not automatically replaced with 3.0 Free in a way that loses entitlements. Free customers can also review supported-environment and document-format changes before a free upgrade.

1. **Information:** Review new features, environments, pricing, previous-version EOL and file-format changes.
2. **Entitlement check:** Check Pro features of the purchased major version. Discounts and new-version upgrade terms are announced before sale.
3. **Backup:** Save all necessary tabs to external ADQ files and separately preserve important documents and settings.
4. **User choice:** Choose to keep the existing version, use the new Free or buy the new Pro. Paid upgrades are not performed without an explicit choice.
5. **Entitlement and migration verification:** Obtain target-version Pro rights and check opening, saving and media with document copies before switching use.
6. **Completion check:** A path back to the previous version and original copies is explained if problems occur. Opening new-format files in older versions is not unconditionally promised.

Windows provides Free and Pro as separate Store apps. Android is preparing entitlement application within one app. Official upgrade and purchase restoration processes are explained separately by platform.

### Document and settings compatibility

In principle, new versions open supported ADQ documents from previous formal releases and preserve content/media. If a format cannot be handled, the original is kept and a conversion/copy path explained. If a new format must be saved, original backups and older-version opening limits are disclosed in advance.

The internal format version can differ even with the same file extension. Older versions do not save with content loss or silently downgrade. Only supported settings are migrated; changes and exclusions are explained. Automatic movement of internal working data between ZIP, Store or different PCs is not guaranteed.

## 7. EOL and ending the entire product

EOL versions may be removed from the default official download. Existing installations and acquired licenses remain; paid customers have an opportunity to preserve the version's final supported installer, purchase evidence and offline entitlements. The Store is not promised to provide reinstallation of historical packages forever.

Risks discovered after EOL are announced officially, with recommendations to move to a safe current version or appropriate alternative. Patches for EOL versions are not promised. An exceptional patch does not restart full support.

If the entire product ends without a successor major version, termination and the stopping of new sales are announced at least 12 months in advance. Critical security/data-loss support continues until termination, with document export, installer preservation and alternatives for ending authentication services. Contracts promising longer support are honored.

Before authentication services end, a way to preserve offline entitlement is provided so existing purchasers can continue using acquired versions. Rather than guaranteeing perpetual operation of external stores, feasible means of maintaining license use are prepared at sale. External service outages are not allowed to hold documents hostage.

## 8. Policy changes

Change dates, effective dates and changes are announced, and historical documents retained. Existing purchasers' perpetual licenses and support periods offered at purchase are not adversely changed retroactively. See also the [EULA](EULA.md) for contract details and the [License Policy](DISTRIBUTION-AND-LICENSE-POLICY.md) for features, pricing and trial conditions.
