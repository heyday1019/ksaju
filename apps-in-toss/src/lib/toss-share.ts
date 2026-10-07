/**
 * 토스 공유 시트로 미니앱을 공유한다. **신규 유입이 생기는 유일한 경로다.**
 *
 * 자사 웹사이트 링크가 아니라 토스 공유 링크를 써야 한다(자사 링크 공유는 심사
 * 반려 사유). 토스 앱이 없는 사람은 스토어로 안내된다.
 *
 * `ogImageUrl` 을 반드시 함께 보낸다 — 비우면 그림이 핵심인 앱의 공유 링크가
 * 미리보기 없는 맨 링크로 돌아다닌다. 받는 사람이 누를 이유가 사라진다.
 * (토스앱 Android 5.240.0 / iOS 5.239.0 미만에서는 무시될 뿐 링크는 정상 동작한다.)
 *
 * 공유 시트는 **텍스트만** 실을 수 있다 — `Share.sendMessage` 가 `{ message }`
 * 하나만 받는다. 결과 카드 이미지 자체를 보내려면 호스팅이 필요하고 그건 이 앱의
 * '외부 통신 0' 원칙과 어긋나므로, 정적 브랜드 이미지로 미리보기만 채운다.
 */

/** 이 미니앱의 진입 딥링크. 콘솔 appName(`ksaju`)과 일치해야 한다. */
const APP_DEEP_LINK = "intoss://ksaju";

/**
 * 공유 미리보기 이미지. 웹앱(ksaju.me)이 이미 서빙하는 1200×630 정적 파일이라
 * 추가 인프라가 없다. CORS 는 `*` 로 열려 있다.
 */
const OG_IMAGE_URL = "https://ksaju.me/og-default.png";

export async function shareMiniApp(message: string): Promise<boolean> {
  try {
    // SDK 는 반드시 동적 import (정적 import 는 웹에서 크래시 + 심사 반려)
    const { Share } = await import("@apps-in-toss/web-framework");
    const link = await Share.createLink({
      path: APP_DEEP_LINK,
      ogImageUrl: OG_IMAGE_URL,
    });
    await Share.sendMessage({ message: `${message}\n${link}` });
    return true;
  } catch {
    return false;
  }
}
