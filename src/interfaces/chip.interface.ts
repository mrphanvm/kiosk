export interface ChipReadResult {
  data: ChipReadData;
  summary: string;
  faceImagePath: string;
  lastAccessCode: string;
  lastReadAt: string; // ISO string
}
export interface ChipReadData {
  cardData: CardData;
  flat: FlatCardData;
  faceImage: FaceImage;
}
export interface CardData {
  Dg1File: {
    Mrz: string;
  };
  Dg13File: {
    Name: string;
    DateOfBirth: string; // yyyy-mm-dd
    Sex: "Nam" | "Nu" | string;
    Nationality: string;
    DocumentNumber: string;
    Hometown: string;
  };
  Dg2File: {
    FaceImage: string 
  }
  VerifySOD: Record<string, any>;
  AaCaAuthen: Record<string, any>;
}
export interface FlatCardData {
  "Dg1File.Mrz": string;

  "Dg13File.FullName": string;
  "Dg13File.DateOfBirth": string;
  "Dg13File.Sex": string;
  "Dg13File.Nationality": string;
  "Dg13File.IdNumber": string;
  "Dg13File.Address": string;

  "VerifySOD.SignatureValid": boolean;
  "AaCaAuthen.Result": string;
}
export interface FaceImage {
  type: string; // image/jpeg
  length: number;
  base64: string;
}
