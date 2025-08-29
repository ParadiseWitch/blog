import fs from 'fs';
import path from 'path';

const moodFile = path.join(process.cwd(), 'docs', 'mood', 'README.md');

const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const formattedDate = `${year}-${month}-${day}`;

const newEntry = `
## ${formattedDate}



---
`;

fs.readFile(moodFile, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  const frontmatterEnd = data.indexOf('---', 3);
  if (frontmatterEnd === -1) {
    console.error('Could not find frontmatter end.');
    return;
  }

  const contentStart = data.indexOf('<div class="mood-list">', frontmatterEnd);
  if (contentStart === -1) {
    console.error('Could not find <div class="mood-list">.');
    return;
  }

  const insertionPoint = contentStart + '<div class="mood-list">'.length;

  const updatedContent = data.slice(0, insertionPoint) + newEntry + data.slice(insertionPoint);

  fs.writeFile(moodFile, updatedContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log(`Added new mood entry for ${formattedDate}`);
  });
});