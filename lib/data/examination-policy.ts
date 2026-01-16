/**
 * MPSTME College Examination Policy
 * 
 * This file will contain the examination policy document.
 * 
 * To add your policy:
 * 1. Extract text from your PDF
 * 2. Paste it here as a string
 * 3. Or load it from Firestore (recommended for production)
 */

export const EXAMINATION_POLICY_PLACEHOLDER = `
MPSTME College Examination Policy

[Your policy document will be added here]

To add your policy:
1. Open the PDF
2. Copy all the text
3. Replace this placeholder text
4. Or use the admin panel to upload it to Firestore
`;

// For now, we'll use an environment variable or Firestore
// In production, load from Firestore
export function getExaminationPolicy(): string {
  // Check environment variable first
  if (process.env.NEXT_PUBLIC_EXAMINATION_POLICY) {
    return process.env.NEXT_PUBLIC_EXAMINATION_POLICY;
  }
  
  // TODO: Load from Firestore
  // const policy = await getDocument("policies", "examination");
  // return policy?.content || "";
  
  return EXAMINATION_POLICY_PLACEHOLDER;
}
