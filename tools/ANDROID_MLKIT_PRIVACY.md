# Android ML Kit disclosure — 2026-10-20

This release preserves existing scanning/OCR/translation behavior and all ML Kit dependencies. It is NOT an offline flavor and must not be described as having no SDK network traffic.

Google documents on-device processing of recognition inputs and outputs, separately from SDK metrics sent to Google. Do not equate on-device inference with zero data transmission. Do not disable INTERNET, strip ML Kit/Google transport classes, or alter undocumented logging APIs to resolve a store declaration.

The updated privacy notice describes confirmed behavior. Individual overseas processing countries and a fixed metrics retention period are not specified in the reviewed ML Kit documents. This release is not evidence that ONE store country selection, consent requirements, or legal review is complete. Do not invent “US only”, select every country without evidence, or send an inquiry against the user's instruction.

Sources:
- https://developers.google.com/ml-kit/terms
- https://developers.google.com/ml-kit/android-data-disclosure
- https://policies.google.com/privacy
- https://policies.google.com/technologies/retention

ONE store release records and final submission status are maintained separately under ProjectETC/MultiStore-2026-10-20/ONE-store. A successful build or binary upload is not a review submission.

The static SeukScan privacy routes contain an Android supplement (Korean on the Korean route, English elsewhere). QR has Korean and English policies. Preserve these sections during regeneration. Android in-app notices link to these maintained policies.
