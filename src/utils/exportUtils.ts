import { SpellingWord, WordStatistics } from '../services/spellingQuizService';

/**
 * Export word list as CSV
 */
export const exportWordsAsCSV = (
  words: SpellingWord[],
  stats: WordStatistics[],
  studentName: string
): void => {
  const headers = ['Word', 'Hint', 'Status', 'Accuracy (%)', 'Total Attempts', 'Correct', 'Incorrect', 'Last Attempted'];
  
  const rows = words.map(word => {
    const stat = stats.find(s => s.wordId === word.id);
    return [
      word.word,
      word.hint,
      word.status,
      stat ? `${stat.accuracy}` : '0',
      stat ? `${stat.totalAttempts}` : '0',
      stat ? `${stat.correctCount}` : '0',
      stat ? `${stat.incorrectCount}` : '0',
      stat?.lastAttempted ? new Date(stat.lastAttempted).toLocaleDateString() : 'Never'
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  downloadFile(
    csvContent,
    `spelling-words-${studentName}-${new Date().toISOString().split('T')[0]}.csv`,
    'text/csv'
  );
};

/**
 * Export word list as formatted text (for printing)
 */
export const exportWordsAsText = (
  words: SpellingWord[],
  stats: WordStatistics[],
  studentName: string,
  includeHints: boolean = true
): void => {
  const activeWords = words.filter(w => w.status === 'active');
  const completedWords = words.filter(w => w.status === 'completed');
  
  const sections: string[] = [];
  
  // Header
  sections.push('='.repeat(60));
  sections.push(`SPELLING WORD LIST - ${studentName.toUpperCase()}`);
  sections.push(`Generated: ${new Date().toLocaleDateString()}`);
  sections.push('='.repeat(60));
  sections.push('');
  
  // Active Words
  if (activeWords.length > 0) {
    sections.push('ACTIVE WORDS TO PRACTICE:');
    sections.push('-'.repeat(60));
    
    activeWords.forEach((word, index) => {
      const stat = stats.find(s => s.wordId === word.id);
      sections.push(`${index + 1}. ${word.word.toUpperCase()}`);
      
      if (includeHints) {
        sections.push(`   Hint: ${word.hint}`);
      }
      
      if (stat && stat.totalAttempts > 0) {
        sections.push(`   Performance: ${stat.accuracy}% (${stat.correctCount}/${stat.totalAttempts} correct)`);
      }
      
      sections.push('');
    });
  }
  
  // Completed Words
  if (completedWords.length > 0) {
    sections.push('');
    sections.push('COMPLETED WORDS (MASTERED):');
    sections.push('-'.repeat(60));
    
    completedWords.forEach((word, index) => {
      const stat = stats.find(s => s.wordId === word.id);
      sections.push(`${index + 1}. ${word.word.toUpperCase()}`);
      
      if (stat && stat.totalAttempts > 0) {
        sections.push(`   Final Score: ${stat.accuracy}% (${stat.correctCount}/${stat.totalAttempts} correct)`);
      }
      
      sections.push('');
    });
  }
  
  // Summary
  sections.push('');
  sections.push('='.repeat(60));
  sections.push('SUMMARY:');
  sections.push(`Total Active Words: ${activeWords.length}`);
  sections.push(`Total Completed Words: ${completedWords.length}`);
  sections.push(`Overall Progress: ${completedWords.length}/${words.length} (${Math.round((completedWords.length / words.length) * 100)}%)`);
  sections.push('='.repeat(60));
  
  const textContent = sections.join('\n');
  
  downloadFile(
    textContent,
    `spelling-list-${studentName}-${new Date().toISOString().split('T')[0]}.txt`,
    'text/plain'
  );
};

/**
 * Export word list as JSON (for backup/import)
 */
export const exportWordsAsJSON = (
  words: SpellingWord[],
  stats: WordStatistics[],
  studentName: string
): void => {
  const exportData = {
    exportDate: new Date().toISOString(),
    studentName,
    version: '1.0',
    words: words.map(word => {
      const stat = stats.find(s => s.wordId === word.id);
      return {
        word: word.word,
        hint: word.hint,
        status: word.status,
        statistics: stat ? {
          totalAttempts: stat.totalAttempts,
          correctCount: stat.correctCount,
          incorrectCount: stat.incorrectCount,
          accuracy: stat.accuracy,
          lastAttempted: stat.lastAttempted
        } : null
      };
    })
  };
  
  const jsonContent = JSON.stringify(exportData, null, 2);
  
  downloadFile(
    jsonContent,
    `spelling-backup-${studentName}-${new Date().toISOString().split('T')[0]}.json`,
    'application/json'
  );
};

/**
 * Export practice sheet (just words, no hints - for testing)
 */
export const exportPracticeSheet = (
  words: SpellingWord[],
  studentName: string
): void => {
  const activeWords = words.filter(w => w.status === 'active');
  
  const sections: string[] = [];
  
  // Header
  sections.push('='.repeat(60));
  sections.push(`SPELLING PRACTICE SHEET - ${studentName.toUpperCase()}`);
  sections.push(`Date: ${new Date().toLocaleDateString()}`);
  sections.push('='.repeat(60));
  sections.push('');
  sections.push('Instructions: Have someone read each hint to you, then write the spelling word.');
  sections.push('');
  sections.push('-'.repeat(60));
  sections.push('');
  
  // Practice words with numbered blanks
  activeWords.forEach((word, index) => {
    sections.push(`${index + 1}. Hint: ${word.hint}`);
    sections.push('');
    sections.push('   Answer: _____________________________________');
    sections.push('');
    sections.push('');
  });
  
  // Answer key on separate page
  sections.push('');
  sections.push('');
  sections.push('='.repeat(60));
  sections.push('ANSWER KEY (fold here or print separately)');
  sections.push('='.repeat(60));
  sections.push('');
  
  activeWords.forEach((word, index) => {
    sections.push(`${index + 1}. ${word.word.toUpperCase()}`);
  });
  
  const textContent = sections.join('\n');
  
  downloadFile(
    textContent,
    `spelling-practice-${studentName}-${new Date().toISOString().split('T')[0]}.txt`,
    'text/plain'
  );
};

/**
 * Helper function to download a file
 */
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export quiz records as CSV
 */
export const exportQuizRecordsAsCSV = (
  records: any[],
  studentName: string
): void => {
  const headers = ['Date', 'Score', 'Total Questions', 'Percentage', 'Time Spent (sec)', 'Time Spent (min:sec)'];
  
  const rows = records.map(record => {
    const timeSpent = record.timeSpent || 0;
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;
    
    return [
      new Date(record.createdAt || record.timestamp || record.date).toLocaleString(),
      `${record.score}`,
      `${record.totalQuestions || record.total}`,
      `${record.percentage}`,
      `${timeSpent}`,
      `${minutes}:${seconds.toString().padStart(2, '0')}`
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  downloadFile(
    csvContent,
    `quiz-history-${studentName}-${new Date().toISOString().split('T')[0]}.csv`,
    'text/csv'
  );
};
