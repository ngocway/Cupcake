export function getCefrPedagogicalGuidelines(level: string): string {
  const cleanLevel = (level || "").toLowerCase().trim();
  if (cleanLevel.includes("pre-a1") || cleanLevel.includes("beginner") || cleanLevel.includes("a1")) {
    return `
    - **Target CEFR Level**: Pre-A1 to A1 (Beginner).
    - **Vocabulary**: Only use very simple, concrete words related to everyday things (family, school, toys, animals, food, colors).
    - **Sentence Structure**: Keep sentences extremely short (1 to 8 words). Use simple Subject-Verb-Object (SVO) structures (e.g., "The cat is small.", "I like apples."). Do not use complex or compound clauses. Only use "and" or "but" for simple coordination.
    - **Grammar**: Only use Present Simple, Present Continuous (for ongoing actions), singular/plural nouns, and basic prepositions of place (in, on, under).
    - **Questions**: Make questions simple and straightforward. Do not use tricky distractors. Keep question and option text extremely simple.
    `;
  } else if (cleanLevel.includes("elementary") || cleanLevel.includes("a2")) {
    return `
    - **Target CEFR Level**: A2 (Elementary).
    - **Vocabulary**: Common daily topics (jobs, hobbies, shopping, travel, simple feelings). Use basic collocations.
    - **Sentence Structure**: Keep sentences short to medium (8 to 12 words). You may use simple compound sentences linked by "because", "so", "or", "then".
    - **Grammar**: Present Simple, Past Simple (including regular and common irregular verbs: went, ate, saw), Future with "be going to" or "will", simple Comparatives/Superlatives (e.g., faster, biggest), and basic modals (can, could, should, must).
    - **Questions**: Direct and clear questions testing routine, simple narratives, or comparisons. Ensure distractors are grammatically incorrect or clearly contextually wrong.
    `;
  } else if (cleanLevel.includes("intermediate") || cleanLevel.includes("b1")) {
    return `
    - **Target CEFR Level**: B1 (Intermediate).
    - **Vocabulary**: Abstract concepts (society, science, environment, career). Use common phrasal verbs and word derivations (prefixes/suffixes like unhappy, agreement).
    - **Sentence Structure**: Sentences of medium length (12 to 18 words). You can use complex sentences with relative clauses (who, which, that, where) and basic conditional clauses.
    - **Grammar**: Present Perfect, Past Continuous vs Past Simple, First and Second Conditionals, and simple Passive Voice.
    - **Questions**: Test main ideas, identifying feelings, or simple paragraph coherence. Distractors must test grammatical precision or contextual nuances.
    `;
  } else {
    // B2 and above
    return `
    - **Target CEFR Level**: B2 (Upper-Intermediate).
    - **Vocabulary**: Academic, idiomatic, and specific professional terms. Highly nuanced synonyms.
    - **Sentence Structure**: Complex sentences with multiple clauses, passive reporting, participle clauses (15 to 25 words).
    - **Grammar**: Past Perfect, Future Perfect, Third and Mixed Conditionals, past modals (should have, might have), and emphasis/inversion structures.
    - **Questions**: Test author tone, writer bias, summarization, and fine contextual reading.
    `;
  }
}
