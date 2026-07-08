from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    tmdb_api_key: str = ""
    anthropic_api_key: str = ""          # new — powers the /recommend endpoint
    secret_key: str = "dev-secret-change-me"
    access_token_expire_minutes: int = 60
    database_url: str = "sqlite:///./reel.db"
    allowed_origins: str = "http://localhost:5173"
    environment: str = "development"      # "development" | "production"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    def validate_for_production(self) -> None:
        """
        Fail fast at startup rather than silently running insecurely.
        Called once from main.py's lifespan handler.
        """
        if not self.is_production:
            return
        if self.secret_key == "dev-secret-change-me":
            raise RuntimeError(
                "SECRET_KEY is still the dev default in production. "
                "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        if "*" in self.origins_list:
            raise RuntimeError(
                "ALLOWED_ORIGINS cannot be '*' in production when allow_credentials=True "
                "— browsers block this combo anyway, but it signals a real misconfiguration."
            )
        if not self.tmdb_api_key:
            raise RuntimeError("TMDB_API_KEY is not set.")
        if not self.anthropic_api_key:
            raise RuntimeError("ANTHROPIC_API_KEY is not set — /recommend will fail.")


settings = Settings()