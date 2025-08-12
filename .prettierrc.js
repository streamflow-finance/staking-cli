module.exports = {
  'arrowParens': 'always',
  'trailingComma': 'all',
  'singleQuote': true,
  'semi': true,
  'tabWidth': 2,
  'printWidth': 120,
  'htmlWhitespaceSensitivity': 'ignore',
  'plugins': [require.resolve('@trivago/prettier-plugin-sort-imports')],
  'importOrder': ['<THIRD_PARTY_MODULES>', '^[./]'],
  'importOrderSeparation': true,
  'importOrderSortSpecifiers': true,
};
