import { createObjectCsvWriter } from 'csv-writer';
import * as path from 'path';
import * as fs from 'fs';

export interface GaokaoData {
  university: string;
  year: number;
  major: string;
  province: string;
  type: string; // e.g. 'Science', 'Arts', 'Comprehensive'
  scoreLine: number;
  admissionCount: number;
  groupName?: string;
  groupScoreLine?: number;
  transferRules?: string;
  postgradRate?: number;
  undergradCount?: number;
  furtherStudyRate?: number;
  furtherStudySchools?: string;
  recruitmentFairs?: string;
  famousEnterprises?: string;
  recruitedCount?: number;
}

export class CsvWriterTool {
  private writer: any;
  private filePath: string;

  constructor(filename: string = 'gaokao_data.csv') {
    this.filePath = path.resolve(process.cwd(), filename);
    
    // Check if file exists to determine if we need to write headers
    const fileExists = fs.existsSync(this.filePath);

    this.writer = createObjectCsvWriter({
      path: this.filePath,
      header: [
        { id: 'university', title: 'University' },
        { id: 'year', title: 'Year' },
        { id: 'major', title: 'Major' },
        { id: 'province', title: 'Province' },
        { id: 'type', title: 'Type' },
        { id: 'scoreLine', title: 'Score Line' },
        { id: 'admissionCount', title: 'Admission Count' },
        { id: 'groupName', title: 'Group Name' },
        { id: 'groupScoreLine', title: 'Group Score Line' },
        { id: 'transferRules', title: 'Transfer Rules' },
        { id: 'postgradRate', title: 'Postgrad Rate (%)' },
        { id: 'undergradCount', title: 'Undergrad Count' },
        { id: 'furtherStudyRate', title: 'Further Study Rate (%)' },
        { id: 'furtherStudySchools', title: 'Further Study Schools' },
        { id: 'recruitmentFairs', title: 'Recruitment Fairs' },
        { id: 'famousEnterprises', title: 'Famous Enterprises' },
        { id: 'recruitedCount', title: 'Recruited Count' }
      ],
      append: fileExists,
    });
  }

  async writeRecords(records: GaokaoData[]): Promise<void> {
    await this.writer.writeRecords(records);
  }
}
