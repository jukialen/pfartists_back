# pfartists_back

---

## 🇬🇧 EN — English (British)

**pfartists_back** is a fully self-built backend application developed independently to gain hands-on experience across the full backend and infrastructure stack. It was designed to serve [Portal for Artists](https://github.com/jukialen/portal_for_artists_in_next) — a social platform for the creative community — and covers everything from application logic to server configuration, security, and cloud infrastructure.

> [!NOTE]
> This project is not used in the latest version of *Portal for Artists*. It was created as a deliberate deep-dive into backend and infrastructure topics, independent of any framework scaffolding or tutorials.

### Skills Demonstrated

- **Backend Architecture** — Designed and built a modular REST API and WebSocket server using NestJS, covering users, posts, comments, groups, friendships, likes, roles, and file management.
- **Authentication & Security** — Implemented session-based auth and OAuth 2.0 social login (Google, Spotify, Discord, LINE) via SuperTokens; secured API endpoints with role-based access control and JWT validation.
- **Server Configuration** — Configured Nginx as a reverse proxy with routing rules; managed inter-service communication in a Docker network.
- **Load & Performance** — Applied Redis caching to reduce database load under concurrent requests; used CloudFront CDN for efficient global media delivery.
- **Cloud Infrastructure** — Integrated AWS S3 for file storage and CloudFront for content distribution; managed IAM-scoped access credentials.
- **Database & ORM** — Modelled relational data with Prisma and PostgreSQL; managed schema migrations in a containerised environment.
- **Containerisation & DevOps** — Orchestrated all services (app, database, cache, auth, proxy) with Docker Compose, including health checks, environment-based configuration, and volume management.
- **Email Delivery** — Integrated MailerSend for transactional emails (account confirmation, password reset).
- **API Documentation** — Auto-generated Swagger/OpenAPI documentation via `@nestjs/swagger`.

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS (TypeScript) |
| ORM | Prisma |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Auth | SuperTokens |
| File Storage | AWS S3 + CloudFront |
| Email | MailerSend |
| Reverse Proxy | Nginx |
| Containerisation | Docker & Docker Compose |
| DB Admin | pgAdmin 4 |

---

## 🇯🇵 JA — 日本語

**pfartists_back** は、バックエンドとインフラ全体にわたる実践的な経験を得るために、独力で開発したバックエンドアプリケーションです。クリエイティブコミュニティ向けのソーシャルプラットフォーム [Portal for Artists](https://github.com/jukialen/portal_for_artists_in_next) のバックエンドとして設計され、アプリケーションロジックからサーバー設定、セキュリティ、クラウドインフラまで幅広くカバーしています。

> [!NOTE]
> このプロジェクトは *Portal for Artists* の最新バージョンでは使用されていません。フレームワークの雛形やチュートリアルに頼らず、バックエンドとインフラを深く学ぶために意図的に作成されました。

### 実証したスキル

- **バックエンドアーキテクチャ** — NestJS を使用したモジュール型 REST API および WebSocket サーバーを設計・構築。ユーザー、投稿、コメント、グループ、フレンド、いいね、ロール、ファイル管理などを実装。
- **認証・セキュリティ** — SuperTokens を用いたセッションベース認証と OAuth 2.0 ソーシャルログイン（Google・Spotify・Discord・LINE）を実装。ロールベースアクセス制御と JWT 検証で API エンドポイントを保護。
- **サーバー設定** — Nginx をリバースプロキシとして設定し、ルーティングルールを構成。Docker ネットワーク上のサービス間通信を管理。
- **負荷・パフォーマンス** — Redis キャッシュを導入して同時リクエスト時のデータベース負荷を軽減。CloudFront CDN によりメディアを効率的にグローバル配信。
- **クラウドインフラ** — ファイルストレージに AWS S3、コンテンツ配信に CloudFront を統合。IAM スコープの認証情報を管理。
- **データベース・ORM** — Prisma と PostgreSQL でリレーショナルデータをモデリング。コンテナ環境でのスキーママイグレーションを管理。
- **コンテナ化・DevOps** — Docker Compose でアプリ・DB・キャッシュ・認証・プロキシの全サービスをオーケストレーション。ヘルスチェック、環境別設定、ボリューム管理も含む。
- **メール配信** — MailerSend を統合したトランザクションメール（アカウント確認・パスワードリセット）の実装。
- **API ドキュメント** — `@nestjs/swagger` による Swagger/OpenAPI ドキュメントの自動生成。

### 技術スタック

| レイヤー | 技術 |
|---|---|
| フレームワーク | NestJS (TypeScript) |
| ORM | Prisma |
| データベース | PostgreSQL 15 |
| キャッシュ | Redis 7 |
| 認証 | SuperTokens |
| ファイルストレージ | AWS S3 + CloudFront |
| メール | MailerSend |
| リバースプロキシ | Nginx |
| コンテナ化 | Docker & Docker Compose |
| DB 管理 | pgAdmin 4 |

---

## 🇵🇱 PL — Polski

**pfartists_back** to samodzielnie zbudowana aplikacja backendowa, stworzona w celu zdobycia praktycznego doświadczenia z całym stosem backendowym i infrastrukturalnym. Zaprojektowana jako backend dla [Portalu dla Artystów](https://github.com/jukialen/portal_for_artists_in_next) — platformy społecznościowej dla środowiska twórczego — obejmuje wszystko: od logiki aplikacji, przez konfigurację serwera i bezpieczeństwo, aż po infrastrukturę chmurową.

> [!NOTE]
> Projekt nie jest używany w najnowszej wersji *Portalu dla Artystów*. Powstał jako świadome głębokie zanurzenie w tematykę backendu i infrastruktury — bez polegania na gotowych szablonach czy tutorialach.

### Zademonstrowane umiejętności

- **Architektura backendu** — Zaprojektowanie i zbudowanie modularnego REST API oraz serwera WebSocket w NestJS, obejmującego użytkowników, posty, komentarze, grupy, znajomych, polubienia, role i zarządzanie plikami.
- **Uwierzytelnianie i bezpieczeństwo** — Implementacja sesyjnego uwierzytelniania i logowania społecznościowego OAuth 2.0 (Google, Spotify, Discord, LINE) przez SuperTokens; zabezpieczenie endpointów API kontrolą dostępu opartą na rolach i walidacją JWT.
- **Konfiguracja serwera** — Konfiguracja Nginx jako reverse proxy z regułami routingu; zarządzanie komunikacją między serwisami w sieci Docker.
- **Obciążenie i wydajność** — Zastosowanie cachowania Redis do redukcji obciążenia bazy danych przy równoległych żądaniach; użycie CloudFront CDN do efektywnej globalnej dystrybucji mediów.
- **Infrastruktura chmurowa** — Integracja AWS S3 do przechowywania plików i CloudFront do dystrybucji treści; zarządzanie poświadczeniami IAM.
- **Baza danych i ORM** — Modelowanie danych relacyjnych w Prisma i PostgreSQL; zarządzanie migracjami schematu w środowisku kontenerowym.
- **Konteneryzacja i DevOps** — Orkiestracja wszystkich serwisów (aplikacja, baza danych, cache, auth, proxy) za pomocą Docker Compose, z healthcheckami, konfiguracją per środowisko i zarządzaniem wolumenami.
- **Wysyłka e-maili** — Integracja MailerSend do wiadomości transakcyjnych (potwierdzenie konta, reset hasła).
- **Dokumentacja API** — Automatycznie generowana dokumentacja Swagger/OpenAPI przy użyciu `@nestjs/swagger`.

### Stos technologiczny

| Warstwa | Technologia |
|---|---|
| Framework | NestJS (TypeScript) |
| ORM | Prisma |
| Baza danych | PostgreSQL 15 |
| Cache | Redis 7 |
| Uwierzytelnianie | SuperTokens |
| Przechowywanie plików | AWS S3 + CloudFront |
| E-mail | MailerSend |
| Reverse Proxy | Nginx |
| Konteneryzacja | Docker & Docker Compose |
| Administracja DB | pgAdmin 4 |
