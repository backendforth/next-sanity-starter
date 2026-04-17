"use client";

import { useEffect } from "react";

export default function GlobalErrorBoundary({
	error,
	reset,
}: {
	error: globalThis.Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Global error:", error);
	}, [error]);

	return (
		<html lang="en">
			<body
				style={{
					fontFamily: "system-ui, sans-serif",
					backgroundColor: "#fafafa",
					color: "#18181b",
					margin: 0,
					padding: 0,
					minHeight: "100vh",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<main
					style={{
						maxWidth: "48rem",
						margin: "0 auto",
						padding: "4rem 1.5rem",
						flex: 1,
						display: "flex",
						flexDirection: "column",
						gap: "1.5rem",
					}}
				>
					<h1 style={{ fontSize: "1.875rem", fontWeight: "bold", margin: 0 }}>
						Something went wrong
					</h1>
					<p style={{ color: "#52525b", margin: 0 }}>
						A critical error occurred. Please try again or return to the home
						page.
					</p>
					<div style={{ display: "flex", gap: "1rem" }}>
						<button
							onClick={reset}
							type="button"
							style={{
								display: "inline-flex",
								alignItems: "center",
								justifyContent: "center",
								borderRadius: "0.375rem",
								backgroundColor: "#18181b",
								padding: "0.5rem 1rem",
								fontSize: "0.875rem",
								fontWeight: 500,
								color: "#fff",
								border: "none",
								cursor: "pointer",
							}}
						>
							Try again
						</button>
						<a
							href="/"
							style={{
								display: "inline-flex",
								alignItems: "center",
								justifyContent: "center",
								borderRadius: "0.375rem",
								border: "1px solid #e4e4e7",
								padding: "0.5rem 1rem",
								fontSize: "0.875rem",
								fontWeight: 500,
								color: "#18181b",
								textDecoration: "none",
								backgroundColor: "transparent",
							}}
						>
							Back to home
						</a>
					</div>
				</main>
			</body>
		</html>
	);
}
