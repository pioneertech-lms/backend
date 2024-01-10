export async function generateTestPdf(page, template) {
    await page.goto('about:blank');
    await page.setContent(template);
    await page.waitForFunction(() => {
        // If MathJax has finished processing
        return window.MathJax && window.MathJax.isReady && window.MathJax.typesetPromise;
    });
    await page.waitForTimeout(1000);
    return await page.pdf({ format: 'A4', printBackground: true });
}
