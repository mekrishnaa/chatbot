export interface EmbeddingService {
  /**
   * Generates a single vector embedding for the input text.
   */
  generateEmbedding(text: string): Promise<number[]>;

  /**
   * Generates vector embeddings for a batch of input texts.
   */
  generateEmbeddings(texts: string[]): Promise<number[][]>;

  /**
   * Returns the vector dimension produced by this model (e.g. 1536).
   */
  getDimension(): number;
}

export const EMBEDDING_SERVICE = 'EMBEDDING_SERVICE';

