export default function replacePlugin() {
  return {
    name: 'replace-localhost',
    enforce: 'post',
    generateBundle(options, bundle) {
      // Loop semua file output
      for (const fileName in bundle) {
        const chunk = bundle[fileName];
        
        // Kalau file JS, replace semua localhost
        if (fileName.endsWith('.js') && chunk.code) {
          const before = chunk.code.length;
          
          chunk.code = chunk.code.replace(
            /http:\/\/localhost:5000/g,
            'https://mp-project-production.up.railway.app'
          );
          
          chunk.code = chunk.code.replace(
            /localhost:5000/g,
            'mp-project-production.up.railway.app'
          );
          
          const after = chunk.code.length;
          
          if (before !== after) {
            console.log(`✅ Replaced localhost in ${fileName}`);
          }
        }
      }
    }
  };
}
