const fs = require('fs');
const path = require('path');

// Fix duplicated aliases
const aliasFixMap = {
  '@assets/assets/': '@assets/',
  '@admin/admin/': '@admin/',
  '@theme/theme/': '@theme/',
  '@layout/layout/': '@layout/',
  '@views/views/': '@views/',
  '@contexts/contexts/': '@contexts/',
  '@hooks/hooks/': '@hooks/',
  '@store/store/': '@store/',
  '@helpers/helpers/': '@helpers/',
  '@config/config/': '@config/',
};

// Fix missing aliases (raw prefixes)
const aliasPrefixFixMap = {
  'assets/css/': '@assets/css/',
  'admin/components/': '@admin/components/',
  'admin/views/': '@views/',
  'admin/layout/': '@layout/',
  'admin/contexts/': '@contexts/',
  'admin/hooks/': '@hooks/',
  'admin/store/': '@store/',
  'admin/config/': '@config/',
  'admin/helpers/': '@helpers/',
  'admin/theme/': '@theme/',
};

function fixAliases(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix duplicated aliases
  Object.entries(aliasFixMap).forEach(([badPath, correctPath]) => {
    if (content.includes(badPath)) {
      content = content.replaceAll(badPath, correctPath);
      changed = true;
    }
  });

  // Fix missing aliases
  Object.entries(aliasPrefixFixMap).forEach(([badPrefix, correctAlias]) => {
    const regex = new RegExp(`(['"])${badPrefix}`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `$1${correctAlias}`);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed aliases in: ${filePath}`);
  } else {
    console.log(`⚠️ No alias issues in: ${filePath}`);
  }
}

function scanFolder(folderPath) {
  fs.readdirSync(folderPath).forEach((file) => {
    const fullPath = path.join(folderPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanFolder(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      fixAliases(fullPath);
    }
  });
}

// Run it on your admin folder
scanFolder('./src/admin');
