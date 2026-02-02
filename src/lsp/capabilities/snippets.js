/**
 * Snippets Capability
 */
function getSnippets(category, tools, lang) {
  const snippets = {
    basic: [{ name: 'basic-workflow', prefix: 'brave-basic', description: lang.snippets?.basicFlow || 'Basic flow', body: ["await browser_init({ headless: ${1:false} });","await navigate({ url: '${2:https://example.com}' });","${0}","await browser_close();"] }],
    login: [{ name: 'login-flow', prefix: 'brave-login', description: lang.snippets?.loginFlow || 'Login flow', body: ["await browser_init({ headless: false, turnstile: true });","await navigate({ url: '${1:https://example.com/login}' });","await type({ selector: '${2:input[name=\"email\"]}', text: '${3:user@example.com}' });","await type({ selector: '${4:input[name=\"password\"]}', text: '${5:password}' });","await click({ selector: '${6:button[type=\"submit\"]}', humanLike: true });","${0}"] }],
    scraping: [{ name: 'scrape-flow', prefix: 'brave-scrape', description: lang.snippets?.scrapeFlow || 'Scraping', body: ["await browser_init({ headless: true });","await navigate({ url: '${1:https://example.com}' });","const content = await get_content({ format: '${2:text}' });","const links = await link_harvester({ types: ['all'] });","${0}","await browser_close();"] }],
    captcha: [{ name: 'captcha-flow', prefix: 'brave-captcha', description: lang.snippets?.captchaFlow || 'CAPTCHA', body: ["await browser_init({ headless: false, turnstile: true });","await navigate({ url: '${1:https://site-with-captcha.com}' });","await solve_captcha({ type: 'auto', timeout: 30000 });","${0}"] }],
  };
  return category && snippets[category] ? snippets[category] : Object.values(snippets).flat();
}
module.exports = { getSnippets };
