import React, { useEffect, useState, useCallback } from "react";

import ImageGrid from "./components/ImageGrid";
import LoginLogoutButton from "./components/LoginLogoutButton";
import Navbar from "./components/Navbar";
import { SpotifyItemTypes } from "./enums/SpotifyItemTypes";

import SpotifyItemList from "./components/SpotifyItemList.jsx";
import "./App.css";

const App = () => {
	const [token, setToken] = useState("");

	const [recentTracks, setRecentTracks] = useState([]);
	const [topArtists, setTopArtists] = useState([]);
	const [topTracks, setTopTracks] = useState([]);
	const [currentItemType, setCurrentItemType] = useState(0);

	const CLIENT_ID = "9140a43db1f0411aa6a5255f3e333b18";
	const REDIRECT_URI =
		window.location.href && window.location.href.includes("localhost")
			? "http://localhost:3000/spotify-most-listened"
			: "https://fraser11241.github.io/spotify-most-listened/";
	const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
	const RESPONSE_TYPE = "token";
	const SCOPE =
		"user-top-read user-read-recently-played user-read-playback-state playlist-modify-public playlist-modify-private";

	useEffect(() => {
		// TODO - handle timeout
		const hash = window.location.hash;
		let token = window.localStorage.getItem("token");

		if (!token && hash) {
			token = hash
				.substring(1)
				.split("&")
				.find((elem) => elem.startsWith("access_token"))
				.split("=")[1];

			window.location.hash = "";
			window.localStorage.setItem("token", token);
		}
		setToken(token);
	}, []);

	const getEndpoint = useCallback(
		async (path, method = "GET") => {
			return await fetch(`https://api.spotify.com/v1/${path}`, {
				method,
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
				.then(async (response) => await response.json())
				.then((json) => {
					return json;
				});
		},
		[token]
	);

	const logout = () => {
		setToken("");
		window.localStorage.removeItem("token");
	};

	const fetchUserRecentTracks = useCallback(
		async (limit = 50, timeRange = "long_term", offset = "0") => {
			const { items } = await getEndpoint(
				`me/player/recently-played?limit=${limit}&offset=${offset}&time_range=${timeRange}`
			);

			const recentTracks = items.map((item) => {
				const { artists, name } = item.track;
				const image = item.track.album.images[0];

				return { artists, name, image };
			});
			return recentTracks;
		},
		[getEndpoint]
	);

	const fetchUserTopTracks = useCallback(
		async (limit = 50, timeRange = "long_term", offset = "0") => {
			const { items } = await getEndpoint(
				`me/top/tracks?limit=${limit}&offset=${offset}&time_range=${timeRange}`
			);

			const topTracks = items.map((item) => {
				const { artists, id, name } = item;
				const image = item.album.images[0];

				return { artists, id, name, image };
			});
			return topTracks;
		},
		[getEndpoint]
	);

	/** Return in form [{image, name, id}, {...}]
	 *
	 */
	const fetchUserTopArtists = useCallback(
		async (limit = 50, timeRange = "long_term", offset = "0") => {
			const { items } = await getEndpoint(
				`me/top/artists?limit=${limit}&offset=${offset}&time_range=${timeRange}`
			);

			const topArtists = items.map((item) => {
				const image = item.images[0] || undefined;
				const { name, id } = item;

				return { image, name, id };
			});
			return topArtists;
		},
		[getEndpoint]
	);

	// Return the correct type of items based on the currentItemType
	const getItems = () => {
		switch (currentItemType) {
			case SpotifyItemTypes.RECENT_TRACK:
				return recentTracks;
			case SpotifyItemTypes.ARTIST:
				return topArtists;
			case SpotifyItemTypes.TOP_TRACK:
				return topTracks;
			default:
				return null;
		}
	};

	console.log(getItems());

	useEffect(() => {
		if (token) {
			(async () => {
				setRecentTracks(await fetchUserRecentTracks());
				setTopArtists(await fetchUserTopArtists());
				setTopTracks(await fetchUserTopTracks());
			})();
		}
	}, [token, fetchUserRecentTracks, fetchUserTopArtists, fetchUserTopTracks]);

	return (
		<div className="page with-sidenav">
			{/* <h1>Most listened</h1> */}
			<LoginLogoutButton
				isLoggedIn={!token}
				loginUrl={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}`}
				handleLogout={logout}
			/>

			{token && (
				<>
					<Navbar
						buttons={[
							{
								text: "Recently listened tracks",
								onClick: () =>
									setCurrentItemType(
										SpotifyItemTypes.RECENT_TRACK
									),
							},
							{
								text: "Most listened artists",
								onClick: () =>
									setCurrentItemType(SpotifyItemTypes.ARTIST),
							},
							{
								text: "Most listened songs",
								onClick: () =>
									setCurrentItemType(
										SpotifyItemTypes.TOP_TRACK
									),
							},
						]}
					/>
				</>
			)}

			<div className="page-content">
				<div
					className="page-header"
					style={{
						width: "100%",
						height: "125px",
						backgroundColor: "turquoise",
					}}
				></div>

				<div className="page-body">
					{recentTracks && recentTracks.length && (
						<SpotifyItemList
							items={getItems()}
							type={currentItemType}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export default App;
