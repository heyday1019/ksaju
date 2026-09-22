/**
 * 토스 공유 시트로 미니앱을 공유한다.
 *
 * 자사 웹사이트 링크가 아니라 `getTossShareLink` 가 만든 토스 공유 링크를
 * 써야 한다(자사 링크 공유는 심사 반려 사유). 토스 앱이 없는 사람은
 * 스토어로 안내된다.
 */
export async function shareMiniApp(message: string): Promise<boolean> {
  try {
    const { getTossShareLink, share } = await import(
      "@apps-in-toss/web-framework"
    );
    const link = await getTossShareLink("intoss://ksaju");
    await share({ message: `${message}\n${link}` });
    return true;
  } catch {
    return false;
  }
}
