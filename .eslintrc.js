/*
 * @Description: ^_^
 * @Author: sharebravery
 * @Date: 2023-05-22 17:33:45
 */
module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['@antfu'],
  rules: {
    '@typescript-eslint/semi': 0,
    '@typescript-eslint/comma-dangle': 0,
    'antfu/if-newline': 0,
    '@typescript-eslint/brace-style': 0,
    'arrow-parens': 0,
    '@typescript-eslint/member-delimiter-style': 0,
  },
};
