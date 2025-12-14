
from playwright.sync_api import Page, expect, sync_playwright

def verify_frontend(page: Page):
    # Navigate to the dashboard
    page.goto("http://localhost:9002/dashboard")

    # Wait for the redirection to login (if any) or check if we land on dashboard
    # Since we don't have auth, we expect a redirect to /login

    try:
        expect(page).to_have_url("http://localhost:9002/login", timeout=5000)
        print("Redirected to login as expected.")
    except:
        print("Did not redirect to login, checking if we are on dashboard.")

    page.screenshot(path="/home/jules/verification/login_redirect.png")

    # Now let's try to visit /portfolio directly
    page.goto("http://localhost:9002/portfolio")
    page.screenshot(path="/home/jules/verification/portfolio_redirect.png")

    print("Screenshots taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_frontend(page)
        finally:
            browser.close()
