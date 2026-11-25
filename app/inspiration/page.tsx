import Link from "next/link";
import InspirationGallery from "@/components/InspirationGallery";

const images = [
  {
    "src": "/photos/5780791660345236807.jpg",
    "caption": "Inspiration 01 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236808.jpg",
    "caption": "Inspiration 02 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236809.jpg",
    "caption": "Inspiration 03 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236810.jpg",
    "caption": "Inspiration 04 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236811.jpg",
    "caption": "Inspiration 05 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236812.jpg",
    "caption": "Inspiration 06 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236813.jpg",
    "caption": "Inspiration 07 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236814.jpg",
    "caption": "Inspiration 08 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236815.jpg",
    "caption": "Inspiration 09 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236816.jpg",
    "caption": "Inspiration 10 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236817.jpg",
    "caption": "Inspiration 11 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236818.jpg",
    "caption": "Inspiration 12 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236819.jpg",
    "caption": "Inspiration 13 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236820.jpg",
    "caption": "Inspiration 14 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236821.jpg",
    "caption": "Inspiration 15 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236822.jpg",
    "caption": "Inspiration 16 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236823.jpg",
    "caption": "Inspiration 17 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236824.jpg",
    "caption": "Inspiration 18 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236825.jpg",
    "caption": "Inspiration 19 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236826.jpg",
    "caption": "Inspiration 20 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236827.jpg",
    "caption": "Inspiration 21 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236828.jpg",
    "caption": "Inspiration 22 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236829.jpg",
    "caption": "Inspiration 23 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236830.jpg",
    "caption": "Inspiration 24 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236831.jpg",
    "caption": "Inspiration 25 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236832.jpg",
    "caption": "Inspiration 26 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236833.jpg",
    "caption": "Inspiration 27 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236834.jpg",
    "caption": "Inspiration 28 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236835.jpg",
    "caption": "Inspiration 29 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236836.jpg",
    "caption": "Inspiration 30 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236837.jpg",
    "caption": "Inspiration 31 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236838.jpg",
    "caption": "Inspiration 32 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236839.jpg",
    "caption": "Inspiration 33 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236840.jpg",
    "caption": "Inspiration 34 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236841.jpg",
    "caption": "Inspiration 35 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236842.jpg",
    "caption": "Inspiration 36 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236853.jpg",
    "caption": "Inspiration 37 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236855.jpg",
    "caption": "Inspiration 38 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236856.jpg",
    "caption": "Inspiration 39 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236857.jpg",
    "caption": "Inspiration 40 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236858.jpg",
    "caption": "Inspiration 41 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236859.jpg",
    "caption": "Inspiration 42 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236860.jpg",
    "caption": "Inspiration 43 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236861.jpg",
    "caption": "Inspiration 44 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236862.jpg",
    "caption": "Inspiration 45 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236863.jpg",
    "caption": "Inspiration 46 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236864.jpg",
    "caption": "Inspiration 47 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236865.jpg",
    "caption": "Inspiration 48 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236866.jpg",
    "caption": "Inspiration 49 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236867.jpg",
    "caption": "Inspiration 50 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236868.jpg",
    "caption": "Inspiration 51 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236869.jpg",
    "caption": "Inspiration 52 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236870.jpg",
    "caption": "Inspiration 53 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236871.jpg",
    "caption": "Inspiration 54 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236872.jpg",
    "caption": "Inspiration 55 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236873.jpg",
    "caption": "Inspiration 56 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236874.jpg",
    "caption": "Inspiration 57 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236875.jpg",
    "caption": "Inspiration 58 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236876.jpg",
    "caption": "Inspiration 59 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236877.jpg",
    "caption": "Inspiration 60 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236878.jpg",
    "caption": "Inspiration 61 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236879.jpg",
    "caption": "Inspiration 62 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236880.jpg",
    "caption": "Inspiration 63 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236881.jpg",
    "caption": "Inspiration 64 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236882%20(1).jpg",
    "caption": "Inspiration 65 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236882.jpg",
    "caption": "Inspiration 66 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236883.jpg",
    "caption": "Inspiration 67 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236884.jpg",
    "caption": "Inspiration 68 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236885.jpg",
    "caption": "Inspiration 69 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236886.jpg",
    "caption": "Inspiration 70 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236887.jpg",
    "caption": "Inspiration 71 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236888%20(1).jpg",
    "caption": "Inspiration 72 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236888.jpg",
    "caption": "Inspiration 73 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236889.jpg",
    "caption": "Inspiration 74 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236890.jpg",
    "caption": "Inspiration 75 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236891.jpg",
    "caption": "Inspiration 76 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236892.jpg",
    "caption": "Inspiration 77 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236893.jpg",
    "caption": "Inspiration 78 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236894.jpg",
    "caption": "Inspiration 79 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236895.jpg",
    "caption": "Inspiration 80 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236896.jpg",
    "caption": "Inspiration 81 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236897.jpg",
    "caption": "Inspiration 82 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236898.jpg",
    "caption": "Inspiration 83 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236899.jpg",
    "caption": "Inspiration 84 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236900.jpg",
    "caption": "Inspiration 85 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236901.jpg",
    "caption": "Inspiration 86 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236902.jpg",
    "caption": "Inspiration 87 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236904.jpg",
    "caption": "Inspiration 88 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236905.jpg",
    "caption": "Inspiration 89 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236906.jpg",
    "caption": "Inspiration 90 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236907.jpg",
    "caption": "Inspiration 91 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236908.jpg",
    "caption": "Inspiration 92 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236909.jpg",
    "caption": "Inspiration 93 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236910.jpg",
    "caption": "Inspiration 94 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236911.jpg",
    "caption": "Inspiration 95 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236912.jpg",
    "caption": "Inspiration 96 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236913.jpg",
    "caption": "Inspiration 97 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236914.jpg",
    "caption": "Inspiration 98 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236915.jpg",
    "caption": "Inspiration 99 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236916.jpg",
    "caption": "Inspiration 100 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236917.jpg",
    "caption": "Inspiration 101 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236918.jpg",
    "caption": "Inspiration 102 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236919.jpg",
    "caption": "Inspiration 103 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236920.jpg",
    "caption": "Inspiration 104 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236921.jpg",
    "caption": "Inspiration 105 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236922.jpg",
    "caption": "Inspiration 106 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236923.jpg",
    "caption": "Inspiration 107 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236924.jpg",
    "caption": "Inspiration 108 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236925.jpg",
    "caption": "Inspiration 109 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236926.jpg",
    "caption": "Inspiration 110 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236928.jpg",
    "caption": "Inspiration 111 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236929.jpg",
    "caption": "Inspiration 112 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236930.jpg",
    "caption": "Inspiration 113 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236931.jpg",
    "caption": "Inspiration 114 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236932.jpg",
    "caption": "Inspiration 115 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236933.jpg",
    "caption": "Inspiration 116 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236934.jpg",
    "caption": "Inspiration 117 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236935.jpg",
    "caption": "Inspiration 118 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236936.jpg",
    "caption": "Inspiration 119 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236937.jpg",
    "caption": "Inspiration 120 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236938.jpg",
    "caption": "Inspiration 121 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236939.jpg",
    "caption": "Inspiration 122 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236940.jpg",
    "caption": "Inspiration 123 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236941.jpg",
    "caption": "Inspiration 124 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236942.jpg",
    "caption": "Inspiration 125 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236943.jpg",
    "caption": "Inspiration 126 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236944.jpg",
    "caption": "Inspiration 127 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236945.jpg",
    "caption": "Inspiration 128 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236946.jpg",
    "caption": "Inspiration 129 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236947.jpg",
    "caption": "Inspiration 130 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236948.jpg",
    "caption": "Inspiration 131 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236949.jpg",
    "caption": "Inspiration 132 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236950.jpg",
    "caption": "Inspiration 133 · Beauty & style"
  },
  {
    "src": "/photos/5780791660345236951.jpg",
    "caption": "Inspiration 134 · Beauty & style"
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
        <h1 className="mt-5 max-w-4xl text-6xl font-light leading-[0.9] tracking-[-0.08em] md:text-8xl">Find your next<br/>favourite look<span className="text-purple-600">.</span></h1>
        <p className="mt-7 max-w-2xl text-base leading-8 text-[#6f6077]">A mix of beauty, hairstyles, hijab, outfits, shoes, accessories and spaces. Explore what catches your eye, then tap any photo to see it up close.</p>
      </section>
      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <InspirationGallery images={images} />
      </section>
      <footer className="border-t border-[#eadff5] bg-white px-5 py-8 text-center text-xs text-[#8a7d91]">Beaura · Inspiration for every mood</footer>
    </main>
  );
}
