import { getGenerativeModel } from "https://esm.run/firebase/ai";
import { ai } from './firebaseConfig.js'; // Import the initialized AI service

// Use the latest, auto-updating Flash model
const model = getGenerativeModel(ai, { model: 'gemini-1.5-flash-latest' });

/**
 * Generates a formal email draft to a legislative office.
 * @param {string} billInfo A string containing the details of the legislation.
 * @param {string} userThoughts A string containing the user's stance on the bill.
 * @returns {Promise<string>} The generated email draft text, or an empty string on error.
 */
async function generateLegislativeEmail(billInfo, userThoughts) {
  let generatedEmailDraft = '';

  if (!billInfo || !userThoughts) {
    console.error('Bill information and user thoughts must be provided.');
    return generatedEmailDraft;
  }

  const systemInstruction = `You are an expert policy analyst and professional correspondence writer. Your task is to draft a formal and persuasive email to a state legislative office (e.g., a State Representative or Senator). The email must adhere to a respectful, formal tone and clearly structure the argument. The email MUST include: 1) A professional salutation (e.g., "Dear Representative [Name] Office,"). 2) Clear identification of the specific bill using the provided details. 3) A body that seamlessly integrates the provided legislation details with the user's personal thoughts and stance, using respectful and specific argumentation. 4) A clear call to action (support or oppose the bill). 5) A professional closing (e.g., "Sincerely," followed by a placeholder for the user's name). Only output the email content itself. Do not include any preamble, markdown formatting (like JSON or code blocks), or conversational text before or after the email draft.`;

  const userQuery = `Please draft a complete email based on the system instructions. Here are the details of the legislation to be referenced: --- LEGISLATION DETAILS --- ${billInfo} --- USER'S PERSONAL STANCE/THOUGHTS (Incorporate this respectfully into the argument) --- ${userThoughts} --- END OF INPUT ---`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });
    
    generatedEmailDraft = result.text;

  } catch (error) {
    console.error('Error generating legislative email via Firebase SDK:', error);
  }

  return generatedEmailDraft;
}

export default generateLegislativeEmail;