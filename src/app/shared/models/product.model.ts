export class Product {
  public _id: string;
  public name: string;
  public code?: string;
  public type?: string;
  public size?: string;
  public description?: string;
  public category?: string;
  public tags?: string[];
  public price: {
    sale: number,
    previous?: number
  };
  public totalQuantity?: number;
  public piecesPerBox?: number;
  public color?: string; // Hexadecimal color value (e.g., #FF5733)
  public ratings?: {
    rating: number,
    ratingCount: number
  };
  public features?: string[];
  public photo?: string;
  public gallery?: string[];
  public badge?: { text: string, color?: string };
}
