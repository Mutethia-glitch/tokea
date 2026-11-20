import type { Category } from "./sessions";
/** Curated documentary drink photography; no decorative icons in session banners.
 * Unsplash photos are free under unsplash.com/license.
 * Traditional Kenyan "mratina" image is from Wikimedia Commons; credit is documented.
 * External photos are display-only assets, never user identity data.
 */
const unsplash=(id:string)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=960&q=82`;
export const DRINK_PHOTOS:Record<Category,string>={
  Beer:unsplash("photo-1535958636474-b021ee887b13"),
  Wine:unsplash("photo-1510812431401-41d2bd2722f3"),
  Cocktails:unsplash("photo-1544145945-f90425340c7e"),
  Muratina:"https://commons.wikimedia.org/wiki/Special:FilePath/%22Mratina%22%20drink%20served%20in%20a%20calabash.jpg?width=960",
  Whiskey:unsplash("photo-1470337458703-46ad1756a187"),
  Vodka:unsplash("photo-1551024709-8f23befc6f87"),
  Gin:unsplash("photo-1513558161293-cdaf765edfd7"),
  Rum:unsplash("photo-1544145945-f90425340c7e"),
  Tequila:unsplash("photo-1513558161293-cdaf765edfd7"),
  Brandy:unsplash("photo-1470337458703-46ad1756a187"),
  Spirits:unsplash("photo-1551024709-8f23befc6f87"),
  Coffee:unsplash("photo-1509042239860-f550ce710b93"),
  "Soft drinks":unsplash("photo-1556679343-c7306c1976bc"),
  Tea:unsplash("photo-1544787219-7f47ccb76574"),
};
