import Link from "next/link";
import InspirationGallery from "@/components/InspirationGallery";

const images = [
  {
    "src": "/photos/5780791660345236807.jpg",
    "caption": "A little wedding-day inspiration"
  },
  {
    "src": "/photos/5780791660345236808.jpg",
    "caption": "A dreamy look for your engagement"
  },
  {
    "src": "/photos/5780791660345236809.jpg",
    "caption": "Soft glam for a special occasion"
  },
  {
    "src": "/photos/5780791660345236810.jpg",
    "caption": "Pretty details for the big day"
  },
  {
    "src": "/photos/5780791660345236811.jpg",
    "caption": "A romantic celebration mood"
  },
  {
    "src": "/photos/5780791660345236812.jpg",
    "caption": "Your next bridal beauty idea"
  },
  {
    "src": "/photos/5780791660345236813.jpg",
    "caption": "An elegant look to save"
  },
  {
    "src": "/photos/5780791660345236814.jpg",
    "caption": "A sweet touch of sparkle"
  },
  {
    "src": "/photos/5780791660345236815.jpg",
    "caption": "A chic look for the occasion"
  },
  {
    "src": "/photos/5780791660345236816.jpg",
    "caption": "A little something for your moodboard"
  },
  {
    "src": "/photos/5780791660345236817.jpg",
    "caption": "Timeless beauty, lovely details"
  },
  {
    "src": "/photos/5780791660345236818.jpg",
    "caption": "A polished look for a night out"
  },
  {
    "src": "/photos/5780791660345236819.jpg",
    "caption": "A graceful and feminine touch"
  },
  {
    "src": "/photos/5780791660345236820.jpg",
    "caption": "The prettiest getting-ready mood"
  },
  {
    "src": "/photos/5780791660345236821.jpg",
    "caption": "A beautiful idea for your special day"
  },
  {
    "src": "/photos/5780791660345236822.jpg",
    "caption": "A fresh take on occasion style"
  },
  {
    "src": "/photos/5780791660345236823.jpg",
    "caption": "A soft and romantic beauty mood"
  },
  {
    "src": "/photos/5780791660345236824.jpg",
    "caption": "A look made for the memories"
  },
  {
    "src": "/photos/5780791660345236825.jpg",
    "caption": "A lovely detail worth saving"
  },
  {
    "src": "/photos/5780791660345236826.jpg",
    "caption": "A little glam moment"
  },
  {
    "src": "/photos/5780791660345236827.jpg",
    "caption": "A little wedding-day inspiration"
  },
  {
    "src": "/photos/5780791660345236828.jpg",
    "caption": "A dreamy look for your engagement"
  },
  {
    "src": "/photos/5780791660345236829.jpg",
    "caption": "Soft glam for a special occasion"
  },
  {
    "src": "/photos/5780791660345236830.jpg",
    "caption": "Pretty details for the big day"
  },
  {
    "src": "/photos/5780791660345236831.jpg",
    "caption": "A romantic celebration mood"
  },
  {
    "src": "/photos/5780791660345236832.jpg",
    "caption": "Your next bridal beauty idea"
  },
  {
    "src": "/photos/5780791660345236833.jpg",
    "caption": "An elegant look to save"
  },
  {
    "src": "/photos/5780791660345236834.jpg",
    "caption": "A sweet touch of sparkle"
  },
  {
    "src": "/photos/5780791660345236835.jpg",
    "caption": "A chic look for the occasion"
  },
  {
    "src": "/photos/5780791660345236836.jpg",
    "caption": "A little something for your moodboard"
  },
  {
    "src": "/photos/5780791660345236837.jpg",
    "caption": "Timeless beauty, lovely details"
  },
  {
    "src": "/photos/5780791660345236838.jpg",
    "caption": "A polished look for a night out"
  },
  {
    "src": "/photos/5780791660345236839.jpg",
    "caption": "A graceful and feminine touch"
  },
  {
    "src": "/photos/5780791660345236840.jpg",
    "caption": "The prettiest getting-ready mood"
  },
  {
    "src": "/photos/5780791660345236841.jpg",
    "caption": "A beautiful idea for your special day"
  },
  {
    "src": "/photos/5780791660345236842.jpg",
    "caption": "A fresh take on occasion style"
  },
  {
    "src": "/photos/5780791660345236853.jpg",
    "caption": "A soft and romantic beauty mood"
  },
  {
    "src": "/photos/5780791660345236855.jpg",
    "caption": "A look made for the memories"
  },
  {
    "src": "/photos/5780791660345236856.jpg",
    "caption": "A lovely detail worth saving"
  },
  {
    "src": "/photos/5780791660345236857.jpg",
    "caption": "A little glam moment"
  },
  {
    "src": "/photos/5780791660345236858.jpg",
    "caption": "A little wedding-day inspiration"
  },
  {
    "src": "/photos/5780791660345236859.jpg",
    "caption": "A dreamy look for your engagement"
  },
  {
    "src": "/photos/5780791660345236860.jpg",
    "caption": "Soft glam for a special occasion"
  },
  {
    "src": "/photos/5780791660345236861.jpg",
    "caption": "Pretty details for the big day"
  },
  {
    "src": "/photos/5780791660345236862.jpg",
    "caption": "A romantic celebration mood"
  },
  {
    "src": "/photos/5780791660345236863.jpg",
    "caption": "Your next bridal beauty idea"
  },
  {
    "src": "/photos/5780791660345236864.jpg",
    "caption": "An elegant look to save"
  },
  {
    "src": "/photos/5780791660345236865.jpg",
    "caption": "A sweet touch of sparkle"
  },
  {
    "src": "/photos/5780791660345236866.jpg",
    "caption": "A chic look for the occasion"
  },
  {
    "src": "/photos/5780791660345236867.jpg",
    "caption": "A little something for your moodboard"
  },
  {
    "src": "/photos/5780791660345236868.jpg",
    "caption": "Timeless beauty, lovely details"
  },
  {
    "src": "/photos/5780791660345236869.jpg",
    "caption": "A polished look for a night out"
  },
  {
    "src": "/photos/5780791660345236870.jpg",
    "caption": "A graceful and feminine touch"
  },
  {
    "src": "/photos/5780791660345236871.jpg",
    "caption": "The prettiest getting-ready mood"
  },
  {
    "src": "/photos/5780791660345236872.jpg",
    "caption": "A beautiful idea for your special day"
  },
  {
    "src": "/photos/5780791660345236873.jpg",
    "caption": "A fresh take on occasion style"
  },
  {
    "src": "/photos/5780791660345236874.jpg",
    "caption": "A soft and romantic beauty mood"
  },
  {
    "src": "/photos/5780791660345236875.jpg",
    "caption": "A look made for the memories"
  },
  {
    "src": "/photos/5780791660345236876.jpg",
    "caption": "A lovely detail worth saving"
  },
  {
    "src": "/photos/5780791660345236877.jpg",
    "caption": "A little glam moment"
  },
  {
    "src": "/photos/5780791660345236878.jpg",
    "caption": "A little wedding-day inspiration"
  },
  {
    "src": "/photos/5780791660345236879.jpg",
    "caption": "A dreamy look for your engagement"
  },
  {
    "src": "/photos/5780791660345236880.jpg",
    "caption": "Soft glam for a special occasion"
  },
  {
    "src": "/photos/5780791660345236881.jpg",
    "caption": "Pretty details for the big day"
  },
  {
    "src": "/photos/5780791660345236882%20(1).jpg",
    "caption": "A romantic celebration mood"
  },
  {
    "src": "/photos/5780791660345236882.jpg",
    "caption": "Your next bridal beauty idea"
  },
  {
    "src": "/photos/5780791660345236883.jpg",
    "caption": "An elegant look to save"
  },
  {
    "src": "/photos/5780791660345236884.jpg",
    "caption": "A sweet touch of sparkle"
  },
  {
    "src": "/photos/5780791660345236885.jpg",
    "caption": "A chic look for the occasion"
  },
  {
    "src": "/photos/5780791660345236886.jpg",
    "caption": "A little something for your moodboard"
  },
  {
    "src": "/photos/5780791660345236887.jpg",
    "caption": "Timeless beauty, lovely details"
  },
  {
    "src": "/photos/5780791660345236888%20(1).jpg",
    "caption": "A polished look for a night out"
  },
  {
    "src": "/photos/5780791660345236888.jpg",
    "caption": "A graceful and feminine touch"
  },
  {
    "src": "/photos/5780791660345236889.jpg",
    "caption": "The prettiest getting-ready mood"
  },
  {
    "src": "/photos/5780791660345236890.jpg",
    "caption": "A beautiful idea for your special day"
  },
  {
    "src": "/photos/5780791660345236891.jpg",
    "caption": "A fresh take on occasion style"
  },
  {
    "src": "/photos/5780791660345236892.jpg",
    "caption": "A soft and romantic beauty mood"
  },
  {
    "src": "/photos/5780791660345236893.jpg",
    "caption": "A look made for the memories"
  },
  {
    "src": "/photos/5780791660345236894.jpg",
    "caption": "A lovely detail worth saving"
  },
  {
    "src": "/photos/5780791660345236895.jpg",
    "caption": "A little glam moment"
  },
  {
    "src": "/photos/5780791660345236896.jpg",
    "caption": "A little wedding-day inspiration"
  },
  {
    "src": "/photos/5780791660345236897.jpg",
    "caption": "A dreamy look for your engagement"
  },
  {
    "src": "/photos/5780791660345236898.jpg",
    "caption": "Soft glam for a special occasion"
  },
  {
    "src": "/photos/5780791660345236899.jpg",
    "caption": "Pretty details for the big day"
  },
  {
    "src": "/photos/5780791660345236900.jpg",
    "caption": "A romantic celebration mood"
  },
  {
    "src": "/photos/5780791660345236901.jpg",
    "caption": "Your next bridal beauty idea"
  },
  {
    "src": "/photos/5780791660345236902.jpg",
    "caption": "An elegant look to save"
  },
  {
    "src": "/photos/5780791660345236904.jpg",
    "caption": "A sweet touch of sparkle"
  },
  {
    "src": "/photos/5780791660345236905.jpg",
    "caption": "A chic look for the occasion"
  },
  {
    "src": "/photos/5780791660345236906.jpg",
    "caption": "A little something for your moodboard"
  },
  {
    "src": "/photos/5780791660345236907.jpg",
    "caption": "Timeless beauty, lovely details"
  },
  {
    "src": "/photos/5780791660345236908.jpg",
    "caption": "A polished look for a night out"
  },
  {
    "src": "/photos/5780791660345236909.jpg",
    "caption": "A graceful and feminine touch"
  },
  {
    "src": "/photos/5780791660345236910.jpg",
    "caption": "The prettiest getting-ready mood"
  },
  {
    "src": "/photos/5780791660345236911.jpg",
    "caption": "A beautiful idea for your special day"
  },
  {
    "src": "/photos/5780791660345236912.jpg",
    "caption": "A fresh take on occasion style"
  },
  {
    "src": "/photos/5780791660345236913.jpg",
    "caption": "A soft and romantic beauty mood"
  },
  {
    "src": "/photos/5780791660345236914.jpg",
    "caption": "A look made for the memories"
  },
  {
    "src": "/photos/5780791660345236915.jpg",
    "caption": "A lovely detail worth saving"
  },
  {
    "src": "/photos/5780791660345236916.jpg",
    "caption": "A little glam moment"
  },
  {
    "src": "/photos/5780791660345236917.jpg",
    "caption": "A little wedding-day inspiration"
  },
  {
    "src": "/photos/5780791660345236918.jpg",
    "caption": "A dreamy look for your engagement"
  },
  {
    "src": "/photos/5780791660345236919.jpg",
    "caption": "Soft glam for a special occasion"
  },
  {
    "src": "/photos/5780791660345236920.jpg",
    "caption": "Pretty details for the big day"
  },
  {
    "src": "/photos/5780791660345236921.jpg",
    "caption": "A romantic celebration mood"
  },
  {
    "src": "/photos/5780791660345236922.jpg",
    "caption": "Your next bridal beauty idea"
  },
  {
    "src": "/photos/5780791660345236923.jpg",
    "caption": "An elegant look to save"
  },
  {
    "src": "/photos/5780791660345236924.jpg",
    "caption": "A sweet touch of sparkle"
  },
  {
    "src": "/photos/5780791660345236925.jpg",
    "caption": "A chic look for the occasion"
  },
  {
    "src": "/photos/5780791660345236926.jpg",
    "caption": "A little something for your moodboard"
  },
  {
    "src": "/photos/5780791660345236928.jpg",
    "caption": "Timeless beauty, lovely details"
  },
  {
    "src": "/photos/5780791660345236929.jpg",
    "caption": "A polished look for a night out"
  },
  {
    "src": "/photos/5780791660345236930.jpg",
    "caption": "A graceful and feminine touch"
  },
  {
    "src": "/photos/5780791660345236931.jpg",
    "caption": "The prettiest getting-ready mood"
  },
  {
    "src": "/photos/5780791660345236932.jpg",
    "caption": "A beautiful idea for your special day"
  },
  {
    "src": "/photos/5780791660345236933.jpg",
    "caption": "A fresh take on occasion style"
  },
  {
    "src": "/photos/5780791660345236934.jpg",
    "caption": "A soft and romantic beauty mood"
  },
  {
    "src": "/photos/5780791660345236935.jpg",
    "caption": "A look made for the memories"
  },
  {
    "src": "/photos/5780791660345236936.jpg",
    "caption": "A lovely detail worth saving"
  },
  {
    "src": "/photos/5780791660345236937.jpg",
    "caption": "A little glam moment"
  },
  {
    "src": "/photos/5780791660345236938.jpg",
    "caption": "A little wedding-day inspiration"
  },
  {
    "src": "/photos/5780791660345236939.jpg",
    "caption": "A dreamy look for your engagement"
  },
  {
    "src": "/photos/5780791660345236940.jpg",
    "caption": "Soft glam for a special occasion"
  },
  {
    "src": "/photos/5780791660345236941.jpg",
    "caption": "Pretty details for the big day"
  },
  {
    "src": "/photos/5780791660345236942.jpg",
    "caption": "A romantic celebration mood"
  },
  {
    "src": "/photos/5780791660345236943.jpg",
    "caption": "Your next bridal beauty idea"
  },
  {
    "src": "/photos/5780791660345236944.jpg",
    "caption": "An elegant look to save"
  },
  {
    "src": "/photos/5780791660345236945.jpg",
    "caption": "A sweet touch of sparkle"
  },
  {
    "src": "/photos/5780791660345236946.jpg",
    "caption": "A chic look for the occasion"
  },
  {
    "src": "/photos/5780791660345236947.jpg",
    "caption": "A little something for your moodboard"
  },
  {
    "src": "/photos/5780791660345236948.jpg",
    "caption": "Timeless beauty, lovely details"
  },
  {
    "src": "/photos/5780791660345236949.jpg",
    "caption": "A polished look for a night out"
  },
  {
    "src": "/photos/5780791660345236950.jpg",
    "caption": "A graceful and feminine touch"
  },
  {
    "src": "/photos/5780791660345236951.jpg",
    "caption": "The prettiest getting-ready mood"
  }
];

export default function InspirationPage() {
  return (
    <main className="min-h-screen bg-[#fffafc] text-[#171018]">
      <header className="sticky top-0 z-40 border-b border-[#eadff5] bg-[#fffafc]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="text-4xl font-light tracking-[-0.09em]">Beaura<span className="text-purple-600">.</span></Link>
          <Link href="/" className="text-sm text-[#6f6077] transition hover:text-purple-700">Back to home</Link>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 pb-10 pt-14 sm:px-8 sm:pt-20">
        <p className="text-xs uppercase tracking-[0.24em] text-purple-700">The Beaura inspiration feed</p>
        <h1 className="mt-5 max-w-4xl text-4xl font-light leading-[0.98] tracking-[-0.06em] sm:text-5xl md:text-6xl">Find your next<br/>favourite look<span className="text-purple-600">.</span></h1>
        <p className="mt-7 max-w-2xl text-sm leading-7 text-[#6f6077]">A mix of beauty, hairstyles, hijab, outfits, shoes, accessories and spaces. Explore what catches your eye, then tap any photo to see it up close.</p>
      </section>
      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <InspirationGallery images={images} />
      </section>
      <footer className="border-t border-[#eadff5] bg-white px-5 py-8 text-center text-xs text-[#8a7d91]">Beaura · Inspiration for every mood</footer>
    </main>
  );
}
