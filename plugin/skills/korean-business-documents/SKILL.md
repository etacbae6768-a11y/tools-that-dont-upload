---
name: korean-business-documents
description: Create Korean business documents and Korean text conversions. Use when the user asks for a 견적서, 거래명세서, 차용증 or 근로계약서, wants an amount written in Korean words (일금 …원정), needs a romanized Korean name, the right particle (은/는, 을/를), initial consonants, a business registration number check, or personal data masked in Korean text.
---

# Korean business documents and text

1. Pick the tool:
   - 견적서 → `kr_quote` (XLSX), 거래명세서 → `kr_transaction_statement` (XLSX)
   - 차용증 → `kr_loan_agreement` (DOCX), 표준근로계약서 → `kr_employment_contract` (DOCX)
   - Amount in words → `ko_amount_words`; romanization → `ko_romanize`; particles → `ko_josa`; 초성 → `ko_chosung`; 사업자번호 → `kr_business_number`; masking → `ko_pii_mask`
2. On the local server these are direct tools that save files to ~/Downloads. On the hosted connector, call `run_tool` with the tool name; documents come back as `file_base64`.
3. For quotes and statements, collect supplier, recipient, date and items (name, qty, unit_price). Ask whether VAT is separate, included or none only if the user did not say; default is separate.
4. For contracts and IOUs, fill only what the user gave. Say clearly that the result is a general template, not legal advice, and point out missing fields such as due date or wage.
5. Reply with the totals (supply amount, VAT, total, amount in words) and where the file was saved. Do not paste raw JSON.
