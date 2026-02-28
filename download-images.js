const fs = require('fs');
const https = require('https');
const path = require('path');

const imagesDir = path.join(__dirname, 'public', 'images');

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const foodImages = [
  { id: 'buckwheat', url: 'https://picsum.photos/seed/buckwheat/200/200' },
  { id: 'millet', url: 'https://picsum.photos/seed/millet/200/200' },
  { id: 'oatmeal', url: 'https://picsum.photos/seed/oatmeal/200/200' },
  { id: 'rice', url: 'https://picsum.photos/seed/rice/200/200' },
  { id: 'sugar', url: 'https://picsum.photos/seed/sugar/200/200' },
  { id: 'beans', url: 'https://picsum.photos/seed/beans/200/200' },
  { id: 'chickpeas', url: 'https://picsum.photos/seed/chickpeas/200/200' },
  { id: 'lentils', url: 'https://picsum.photos/seed/lentils/200/200' },
  { id: 'pasta_premium', url: 'https://picsum.photos/seed/pasta1/200/200' },
  { id: 'pasta_standard', url: 'https://picsum.photos/seed/pasta2/200/200' },
  { id: 'ptitim', url: 'https://picsum.photos/seed/ptitim/200/200' },
  { id: 'pork', url: 'https://picsum.photos/seed/pork/200/200' },
  { id: 'peas', url: 'https://picsum.photos/seed/peas/200/200' },
  { id: 'pepper', url: 'https://picsum.photos/seed/pepper/200/200' },
  { id: 'coffee', url: 'https://picsum.photos/seed/coffee/200/200' },
  { id: 'salt', url: 'https://picsum.photos/seed/salt/200/200' },
];

const containerImages = [
  { id: 'box', url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=800' },
  { id: 'household', url: 'https://images.unsplash.com/photo-1591193583824-1b7038a7919b?auto=format&fit=crop&q=80&w=800' },
  { id: 'expedition', url: 'https://images.unsplash.com/photo-1521331869997-29e24744e073?auto=format&fit=crop&q=80&w=800' },
  { id: 'crate', url: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&q=80&w=800' },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302) {
        https.get(response.headers.location, (res) => {
           res.pipe(file);
           file.on('finish', () => {
             file.close(resolve);
           });
        }).on('error', (err) => {
          fs.unlink(dest, () => reject(err));
        });
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function run() {
  for (const item of [...foodImages, ...containerImages]) {
    const ext = item.url.includes('unsplash') ? 'jpg' : 'jpg';
    const dest = path.join(imagesDir, `${item.id}.${ext}`);
    console.log(`Downloading ${item.id}...`);
    try {
      await download(item.url, dest);
      console.log(`Saved ${item.id}`);
    } catch (e) {
      console.error(`Failed ${item.id}:`, e);
    }
  }
}

run();
