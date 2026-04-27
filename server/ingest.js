import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const openai = new OpenAI();

async function uploadFiles() {
  const roles = ['HR', 'Finance', 'Engineering'];

  for (const role of roles) {
    const folderPath = path.join(process.cwd(), 'data', role);
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      const content = fs.readFileSync(path.join(folderPath, file), 'utf8');

      // 1. Create a "mathematical meaning" (embedding) of the text
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: content,
      });

      const embedding = embeddingResponse.data[0].embedding;

      // 2. Save everything to Supabase
      const { error } = await supabase.from('documents').insert({
        content,
        role,
        embedding
      });

      if (error) console.error("Error saving:", error);
      else console.log(`✅ Uploaded: ${file} (${role})`);
    }
  }
}

uploadFiles();