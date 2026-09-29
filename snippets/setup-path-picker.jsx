{/* Mintlify evaluates each snippet export in isolation inside the page's MDX
    scope, so everything the component references must live inside this one
    export — module-level constants would be undefined at runtime.

    The picker only routes: every step links to the canonical page that owns
    the detail (one home per fact). Update the links here when those pages
    move, and keep facts (IPs, token scopes, commands) on their own pages.

    Layout and colour live in styles.css under .setup-path. Interface icons
    are Tabler outlines, the docs icon library; warehouse, git host, and dbt
    marks are the vendors' own logos. */}

export const SetupPathPicker = () => {
  const CONNECT = "/integrations/connect-project";
  const PREPARE = "/integrations/dbt";
  const CICD = "/workflow/set-up-ci-cd";
  const ORDER = ["host", "edition", "model", "wh", "net", "sync", "git"];

  const ICONS = {
    "arrow-right": {"p":["M5 12l14 0","M13 18l6 -6","M13 6l6 6"]},
    "athena": {"d":"M6.763 10.036c0 .296.032.535.088.71.064.176.144.368.256.576.04.063.056.127.056.183 0 .08-.048.16-.152.24l-.503.335a.383.383 0 0 1-.208.072c-.08 0-.16-.04-.239-.112a2.47 2.47 0 0 1-.287-.375 6.18 6.18 0 0 1-.248-.471c-.622.734-1.405 1.101-2.347 1.101-.67 0-1.205-.191-1.596-.574-.391-.384-.59-.894-.59-1.533 0-.678.239-1.23.726-1.644.487-.415 1.133-.623 1.955-.623.272 0 .551.024.846.064.296.04.6.104.918.176v-.583c0-.607-.127-1.03-.375-1.277-.255-.248-.686-.367-1.3-.367-.28 0-.568.031-.863.103-.295.072-.583.16-.862.272a2.287 2.287 0 0 1-.28.104.488.488 0 0 1-.127.023c-.112 0-.168-.08-.168-.247v-.391c0-.128.016-.224.056-.28a.597.597 0 0 1 .224-.167c.279-.144.614-.264 1.005-.36a4.84 4.84 0 0 1 1.246-.151c.95 0 1.644.216 2.091.647.439.43.662 1.085.662 1.963v2.586zm-3.24 1.214c.263 0 .534-.048.822-.144.287-.096.543-.271.758-.51.128-.152.224-.32.272-.512.047-.191.08-.423.08-.694v-.335a6.66 6.66 0 0 0-.735-.136 6.02 6.02 0 0 0-.75-.048c-.535 0-.926.104-1.19.32-.263.215-.39.518-.39.917 0 .375.095.655.295.846.191.2.47.296.838.296zm6.41.862c-.144 0-.24-.024-.304-.08-.064-.048-.12-.16-.168-.311L7.586 5.55a1.398 1.398 0 0 1-.072-.32c0-.128.064-.2.191-.2h.783c.151 0 .255.025.31.08.065.048.113.16.16.312l1.342 5.284 1.245-5.284c.04-.16.088-.264.151-.312a.549.549 0 0 1 .32-.08h.638c.152 0 .256.025.32.08.063.048.12.16.151.312l1.261 5.348 1.381-5.348c.048-.16.104-.264.16-.312a.52.52 0 0 1 .311-.08h.743c.127 0 .2.065.2.2 0 .04-.009.08-.017.128a1.137 1.137 0 0 1-.056.2l-1.923 6.17c-.048.16-.104.263-.168.311a.51.51 0 0 1-.303.08h-.687c-.151 0-.255-.024-.32-.08-.063-.056-.119-.16-.15-.32l-1.238-5.148-1.23 5.14c-.04.16-.087.264-.15.32-.065.056-.177.08-.32.08zm10.256.215c-.415 0-.83-.048-1.229-.143-.399-.096-.71-.2-.918-.32-.128-.071-.215-.151-.247-.223a.563.563 0 0 1-.048-.224v-.407c0-.167.064-.247.183-.247.048 0 .096.008.144.024.048.016.12.048.2.08.271.12.566.215.878.279.319.064.63.096.95.096.502 0 .894-.088 1.165-.264a.86.86 0 0 0 .415-.758.777.777 0 0 0-.215-.559c-.144-.151-.416-.287-.807-.415l-1.157-.36c-.583-.183-1.014-.454-1.277-.813a1.902 1.902 0 0 1-.4-1.158c0-.335.073-.63.216-.886.144-.255.335-.479.575-.654.24-.184.51-.32.83-.415.32-.096.655-.136 1.006-.136.175 0 .359.008.535.032.183.024.35.056.518.088.16.04.312.08.455.127.144.048.256.096.336.144a.69.69 0 0 1 .24.2.43.43 0 0 1 .071.263v.375c0 .168-.064.256-.184.256a.83.83 0 0 1-.303-.096 3.652 3.652 0 0 0-1.532-.311c-.455 0-.815.071-1.062.223-.248.152-.375.383-.375.71 0 .224.08.416.24.567.159.152.454.304.877.44l1.134.358c.574.184.99.44 1.237.767.247.327.367.702.367 1.117 0 .343-.072.655-.207.926-.144.272-.336.511-.583.703-.248.2-.543.343-.886.447-.36.111-.734.167-1.142.167zM21.698 16.207c-2.626 1.94-6.442 2.969-9.722 2.969-4.598 0-8.74-1.7-11.87-4.526-.247-.223-.024-.527.272-.351 3.384 1.963 7.559 3.153 11.877 3.153 2.914 0 6.114-.607 9.06-1.852.439-.2.814.287.383.607zM22.792 14.961c-.336-.43-2.22-.207-3.074-.103-.255.032-.295-.192-.063-.36 1.5-1.053 3.967-.75 4.254-.399.287.36-.08 2.826-1.485 4.007-.215.184-.423.088-.327-.151.32-.79 1.03-2.57.695-2.994z","c":"#FF9900","dark":true},
    "azure": {"d":"M0 8.877L2.247 5.91l8.405-3.416V.022l7.37 5.393L2.966 8.338v8.225L0 15.707zm24-4.45v14.651l-5.753 4.9-9.303-3.057v3.056l-5.978-7.416 15.057 1.798V5.415z","c":"#0078D7"},
    "bigquery": {"d":"M5.676 10.595h2.052v5.244a5.892 5.892 0 0 1-2.052-2.088v-3.156zm18.179 10.836a.504.504 0 0 1 0 .708l-1.716 1.716a.504.504 0 0 1-.708 0l-4.248-4.248a.206.206 0 0 1-.007-.007c-.02-.02-.028-.045-.043-.066a10.736 10.736 0 0 1-6.334 2.065C4.835 21.599 0 16.764 0 10.799S4.835 0 10.8 0s10.799 4.835 10.799 10.8c0 2.369-.772 4.553-2.066 6.333.025.017.052.028.074.05l4.248 4.248zm-5.028-10.632a8.015 8.015 0 1 0-8.028 8.028h.024a8.016 8.016 0 0 0 8.004-8.028zm-4.86 4.98a6.002 6.002 0 0 0 2.04-2.184v-1.764h-2.04v3.948zm-4.5.948c.442.057.887.08 1.332.072.4.025.8.025 1.2 0V7.692H9.468v9.035z","c":"#4285F4"},
    "bitbucket": {"d":"M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z","c":"#2684FF"},
    "check": {"p":["M5 12l5 5l10 -10"]},
    "chevron-right": {"p":["M9 6l6 6l-6 6"]},
    "clickhouse": {"d":"M21.333 10H24v4h-2.667ZM16 1.335h2.667v21.33H16Zm-5.333 0h2.666v21.33h-2.666ZM0 22.665V1.335h2.667v21.33zm5.333-21.33H8v21.33H5.333Z","c":"#FFCC01","dark":true},
    "cloud": {"p":["M6.657 18c-2.572 0 -4.657 -2.007 -4.657 -4.483c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 1.927 -1.551 3.487 -3.465 3.487h-11.878"]},
    "databricks": {"d":"M.95 14.184L12 20.403l9.919-5.55v2.21L12 22.662l-10.484-5.96-.565.308v.77L12 24l11.05-6.218v-4.317l-.515-.309L12 19.118l-9.867-5.653v-2.21L12 16.805l11.05-6.218V6.32l-.515-.308L12 11.974 2.647 6.681 12 1.388l7.76 4.368.668-.411v-.566L12 0 .95 6.27v.72L12 13.207l9.919-5.55v2.26L12 15.52 1.516 9.56l-.565.308Z","c":"#FF3621"},
    "dbt": {"d":"M17.9004 9.3763a8.1488 8.1488 0 0 0-3.0421-3.1206l1.7708.8385a10.2874 10.2874 0 0 1 3.74 3.0007l3.234-5.9295a2.8546 2.8546 0 0 0-.0611-2.9604C22.7566.0371 21.2112-.3409 19.9754.3327l-5.8749 3.2101a4.3612 4.3612 0 0 1-4.1761 0L4.1769.408a2.8545 2.8545 0 0 0-2.9592.0632c-1.1673.7853-1.5452 2.33-.8723 3.5655L3.55 9.9106a4.3612 4.3612 0 0 1 0 4.1772l-3.1272 5.743a2.86 2.86 0 0 0 .085 2.9974c.794 1.1438 2.3225 1.5054 3.5448.8385l6.0581-3.3049a10.2877 10.2877 0 0 1-3.0051-3.7454l-.8374-1.7708a8.148 8.148 0 0 0 3.1206 3.0421l10.5832 5.779c1.2213.666 2.7481.3055 3.5426-.8363a2.8699 2.8699 0 0 0 .0796-3.0018L17.9004 9.3763zm3.3801-7.7351c.6022 0 1.0904.4882 1.0904 1.0904s-.4882 1.0904-1.0904 1.0904-1.0904-.4882-1.0904-1.0904.4882-1.0904 1.0904-1.0904zM2.7442 3.822c-.6022 0-1.0904-.4882-1.0904-1.0904s.4882-1.0904 1.0904-1.0904 1.0904.4882 1.0904 1.0904S3.3464 3.822 2.7442 3.822zm0 18.5363c-.6022 0-1.0904-.4882-1.0904-1.0904 0-.6022.4882-1.0904 1.0904-1.0904s1.0904.4882 1.0904 1.0904c0 .6022-.4882 1.0904-1.0904 1.0904zm10.3585-11.4489c-1.2008-.0035-2.177.9672-2.1805 2.1679a2.1738 2.1738 0 0 0 .7052 1.6091c-1.4872-.2091-2.5234-1.5843-2.3142-3.0716.2091-1.4872 1.5843-2.5234 3.0716-2.3142a2.7194 2.7194 0 0 1 2.3142 2.3142 2.1623 2.1623 0 0 0-1.5963-.7054zm8.1778 11.4489c-.6022 0-1.0904-.4882-1.0904-1.0904 0-.6022.4882-1.0904 1.0904-1.0904s1.0904.4882 1.0904 1.0904c0 .6022-.4882 1.0904-1.0904 1.0904z","c":"#FF694B"},
    "duckdb": {"d":"M12 0C5.363 0 0 5.363 0 12s5.363 12 12 12 12-5.363 12-12S18.637 0 12 0zM9.502 7.03a4.974 4.974 0 0 1 4.97 4.97 4.974 4.974 0 0 1-4.97 4.97A4.974 4.974 0 0 1 4.532 12a4.974 4.974 0 0 1 4.97-4.97zm6.563 3.183h2.351c.98 0 1.787.782 1.787 1.762s-.807 1.789-1.787 1.789h-2.351v-3.551z","c":"#FFF000","dark":true},
    "eye": {"p":["M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0","M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"]},
    "file-code": {"p":["M14 3v4a1 1 0 0 0 1 1h4","M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z","M10 13l-1 2l1 2","M14 13l1 2l-1 2"]},
    "file-text": {"p":["M14 3v4a1 1 0 0 0 1 1h4","M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z","M9 9l1 0","M9 13l6 0","M9 17l6 0"]},
    "git-branch": {"p":["M7 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0","M7 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0","M17 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0","M7 8l0 8","M9 18h6a2 2 0 0 0 2 -2v-5","M14 14l3 -3l3 3"]},
    "git-merge": {"p":["M7 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0","M7 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0","M17 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0","M7 8l0 8","M7 8a4 4 0 0 0 4 4h4"]},
    "github": {"d":"M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12","c":"currentColor"},
    "gitlab": {"d":"m23.6004 9.5927-.0337-.0862L20.3.9814a.851.851 0 0 0-.3362-.405.8748.8748 0 0 0-.9997.0539.8748.8748 0 0 0-.29.4399l-2.2055 6.748H7.5375l-2.2057-6.748a.8573.8573 0 0 0-.29-.4412.8748.8748 0 0 0-.9997-.0537.8585.8585 0 0 0-.3362.4049L.4332 9.5015l-.0325.0862a6.0657 6.0657 0 0 0 2.0119 7.0105l.0113.0087.03.0213 4.976 3.7264 2.462 1.8633 1.4995 1.1321a1.0085 1.0085 0 0 0 1.2197 0l1.4995-1.1321 2.4619-1.8633 5.006-3.7489.0125-.01a6.0682 6.0682 0 0 0 2.0094-7.003z","c":"#FC6D26"},
    "license": {"p":["M15 21h-9a3 3 0 0 1 -3 -3v-1h10v2a2 2 0 0 0 4 0v-14a2 2 0 1 1 2 2h-2m2 -4h-11a3 3 0 0 0 -3 3v11","M9 7l4 0","M9 11l4 0"]},
    "link": {"p":["M9 15l6 -6","M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464","M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463"]},
    "lock": {"p":["M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6z","M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0","M8 11v-4a4 4 0 1 1 8 0v4"]},
    "lock-open": {"p":["M5 11m0 2a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2z","M12 16m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0","M8 11v-5a4 4 0 0 1 8 0"]},
    "player-play": {"p":["M7 4v16l13 -8z"]},
    "plug": {"p":["M9.785 6l8.215 8.215l-2.054 2.054a5.81 5.81 0 1 1 -8.215 -8.215l2.054 -2.054z","M4 20l3.5 -3.5","M15 4l-3.5 3.5","M20 9l-3.5 3.5"]},
    "postgres": {"d":"M23.5594 14.7228a.5269.5269 0 0 0-.0563-.1191c-.139-.2632-.4768-.3418-1.0074-.2321-1.6533.3411-2.2935.1312-2.5256-.0191 1.342-2.0482 2.445-4.522 3.0411-6.8297.2714-1.0507.7982-3.5237.1222-4.7316a1.5641 1.5641 0 0 0-.1509-.235C21.6931.9086 19.8007.0248 17.5099.0005c-1.4947-.0158-2.7705.3461-3.1161.4794a9.449 9.449 0 0 0-.5159-.0816 8.044 8.044 0 0 0-1.3114-.1278c-1.1822-.0184-2.2038.2642-3.0498.8406-.8573-.3211-4.7888-1.645-7.2219.0788C.9359 2.1526.3086 3.8733.4302 6.3043c.0409.818.5069 3.334 1.2423 5.7436.4598 1.5065.9387 2.7019 1.4334 3.582.553.9942 1.1259 1.5933 1.7143 1.7895.4474.1491 1.1327.1441 1.8581-.7279.8012-.9635 1.5903-1.8258 1.9446-2.2069.4351.2355.9064.3625 1.39.3772a.0569.0569 0 0 0 .0004.0041 11.0312 11.0312 0 0 0-.2472.3054c-.3389.4302-.4094.5197-1.5002.7443-.3102.064-1.1344.2339-1.1464.8115-.0025.1224.0329.2309.0919.3268.2269.4231.9216.6097 1.015.6331 1.3345.3335 2.5044.092 3.3714-.6787-.017 2.231.0775 4.4174.3454 5.0874.2212.5529.7618 1.9045 2.4692 1.9043.2505 0 .5263-.0291.8296-.0941 1.7819-.3821 2.5557-1.1696 2.855-2.9059.1503-.8707.4016-2.8753.5388-4.1012.0169-.0703.0357-.1207.057-.1362.0007-.0005.0697-.0471.4272.0307a.3673.3673 0 0 0 .0443.0068l.2539.0223.0149.001c.8468.0384 1.9114-.1426 2.5312-.4308.6438-.2988 1.8057-1.0323 1.5951-1.6698zM2.371 11.8765c-.7435-2.4358-1.1779-4.8851-1.2123-5.5719-.1086-2.1714.4171-3.6829 1.5623-4.4927 1.8367-1.2986 4.8398-.5408 6.108-.13-.0032.0032-.0066.0061-.0098.0094-2.0238 2.044-1.9758 5.536-1.9708 5.7495-.0002.0823.0066.1989.0162.3593.0348.5873.0996 1.6804-.0735 2.9184-.1609 1.1504.1937 2.2764.9728 3.0892.0806.0841.1648.1631.2518.2374-.3468.3714-1.1004 1.1926-1.9025 2.1576-.5677.6825-.9597.5517-1.0886.5087-.3919-.1307-.813-.5871-1.2381-1.3223-.4796-.839-.9635-2.0317-1.4155-3.5126zm6.0072 5.0871c-.1711-.0428-.3271-.1132-.4322-.1772.0889-.0394.2374-.0902.4833-.1409 1.2833-.2641 1.4815-.4506 1.9143-1.0002.0992-.126.2116-.2687.3673-.4426a.3549.3549 0 0 0 .0737-.1298c.1708-.1513.2724-.1099.4369-.0417.156.0646.3078.26.3695.4752.0291.1016.0619.2945-.0452.4444-.9043 1.2658-2.2216 1.2494-3.1676 1.0128zm2.094-3.988-.0525.141c-.133.3566-.2567.6881-.3334 1.003-.6674-.0021-1.3168-.2872-1.8105-.8024-.6279-.6551-.9131-1.5664-.7825-2.5004.1828-1.3079.1153-2.4468.079-3.0586-.005-.0857-.0095-.1607-.0122-.2199.2957-.2621 1.6659-.9962 2.6429-.7724.4459.1022.7176.4057.8305.928.5846 2.7038.0774 3.8307-.3302 4.7363-.084.1866-.1633.3629-.2311.5454zm7.3637 4.5725c-.0169.1768-.0358.376-.0618.5959l-.146.4383a.3547.3547 0 0 0-.0182.1077c-.0059.4747-.054.6489-.115.8693-.0634.2292-.1353.4891-.1794 1.0575-.11 1.4143-.8782 2.2267-2.4172 2.5565-1.5155.3251-1.7843-.4968-2.0212-1.2217a6.5824 6.5824 0 0 0-.0769-.2266c-.2154-.5858-.1911-1.4119-.1574-2.5551.0165-.5612-.0249-1.9013-.3302-2.6462.0044-.2932.0106-.5909.019-.8918a.3529.3529 0 0 0-.0153-.1126 1.4927 1.4927 0 0 0-.0439-.208c-.1226-.4283-.4213-.7866-.7797-.9351-.1424-.059-.4038-.1672-.7178-.0869.067-.276.1831-.5875.309-.9249l.0529-.142c.0595-.16.134-.3257.213-.5012.4265-.9476 1.0106-2.2453.3766-5.1772-.2374-1.0981-1.0304-1.6343-2.2324-1.5098-.7207.0746-1.3799.3654-1.7088.5321a5.6716 5.6716 0 0 0-.1958.1041c.0918-1.1064.4386-3.1741 1.7357-4.4823a4.0306 4.0306 0 0 1 .3033-.276.3532.3532 0 0 0 .1447-.0644c.7524-.5706 1.6945-.8506 2.802-.8325.4091.0067.8017.0339 1.1742.081 1.939.3544 3.2439 1.4468 4.0359 2.3827.8143.9623 1.2552 1.9315 1.4312 2.4543-1.3232-.1346-2.2234.1268-2.6797.779-.9926 1.4189.543 4.1729 1.2811 5.4964.1353.2426.2522.4522.2889.5413.2403.5825.5515.9713.7787 1.2552.0696.087.1372.1714.1885.245-.4008.1155-1.1208.3825-1.0552 1.717-.0123.1563-.0423.4469-.0834.8148-.0461.2077-.0702.4603-.0994.7662zm.8905-1.6211c-.0405-.8316.2691-.9185.5967-1.0105a2.8566 2.8566 0 0 0 .135-.0406 1.202 1.202 0 0 0 .1342.103c.5703.3765 1.5823.4213 3.0068.1344-.2016.1769-.5189.3994-.9533.6011-.4098.1903-1.0957.333-1.7473.3636-.7197.0336-1.0859-.0807-1.1721-.151zm.5695-9.2712c-.0059.3508-.0542.6692-.1054 1.0017-.055.3576-.112.7274-.1264 1.1762-.0142.4368.0404.8909.0932 1.3301.1066.887.216 1.8003-.2075 2.7014a3.5272 3.5272 0 0 1-.1876-.3856c-.0527-.1276-.1669-.3326-.3251-.6162-.6156-1.1041-2.0574-3.6896-1.3193-4.7446.3795-.5427 1.3408-.5661 2.1781-.463zm.2284 7.0137a12.3762 12.3762 0 0 0-.0853-.1074l-.0355-.0444c.7262-1.1995.5842-2.3862.4578-3.4385-.0519-.4318-.1009-.8396-.0885-1.2226.0129-.4061.0666-.7543.1185-1.0911.0639-.415.1288-.8443.1109-1.3505.0134-.0531.0188-.1158.0118-.1902-.0457-.4855-.5999-1.938-1.7294-3.253-.6076-.7073-1.4896-1.4972-2.6889-2.0395.5251-.1066 1.2328-.2035 2.0244-.1859 2.0515.0456 3.6746.8135 4.8242 2.2824a.908.908 0 0 1 .0667.1002c.7231 1.3556-.2762 6.2751-2.9867 10.5405zm-8.8166-6.1162c-.025.1794-.3089.4225-.6211.4225a.5821.5821 0 0 1-.0809-.0056c-.1873-.026-.3765-.144-.5059-.3156-.0458-.0605-.1203-.178-.1055-.2844.0055-.0401.0261-.0985.0925-.1488.1182-.0894.3518-.1226.6096-.0867.3163.0441.6426.1938.6113.4186zm7.9305-.4114c.0111.0792-.049.201-.1531.3102-.0683.0717-.212.1961-.4079.2232a.5456.5456 0 0 1-.075.0052c-.2935 0-.5414-.2344-.5607-.3717-.024-.1765.2641-.3106.5611-.352.297-.0414.6111.0088.6356.1851z","c":"#4169E1"},
    "redshift": {"d":"M16.639 9.932a.822.822 0 0 1-.822-.82.823.823 0 0 1 1.645 0c0 .452-.37.82-.823.82m-2.086 4.994a.823.823 0 0 1-.822-.822.822.822 0 0 1 1.645 0 .822.822 0 0 1-.823.822m-5.004-.833a.822.822 0 1 1 .002-1.644.822.822 0 0 1-.002 1.644m-2.083 4.578a.823.823 0 0 1-.823-.82.823.823 0 0 1 1.645 0c0 .452-.37.82-.822.82m9.173-11.236a1.68 1.68 0 0 0-1.68 1.676c0 .566.285 1.066.718 1.37l-.782 1.982a1.674 1.674 0 0 0-1.923 1.104l-1.753-.398a1.675 1.675 0 0 0-3.348.103c0 .432.169.823.438 1.12l-.764 1.79c-.028-.001-.053-.008-.08-.008a1.68 1.68 0 0 0-1.68 1.676 1.68 1.68 0 0 0 3.36 0c0-.593-.312-1.112-.778-1.41l.674-1.579c.161.052.33.088.508.088.661 0 1.228-.386 1.502-.94l1.856.42a1.68 1.68 0 0 0 3.327-.325c0-.5-.224-.943-.574-1.25l.822-2.083c.053.005.104.016.157.016a1.68 1.68 0 0 0 1.68-1.676 1.68 1.68 0 0 0-1.68-1.676M12 23.145c-4.17 0-7.286-1.252-7.286-2.37V4.79C6.14 5.938 9.131 6.547 12 6.547c2.869 0 5.86-.609 7.286-1.756v15.983c0 1.12-3.116 2.37-7.286 2.37M12 .856c4.293 0 7.286 1.274 7.286 2.419 0 1.143-2.993 2.418-7.286 2.418-4.293 0-7.286-1.275-7.286-2.418C4.714 2.129 7.707.855 12 .855m8.143 2.419C20.143 1.147 15.947 0 12 0 8.052 0 3.857 1.147 3.857 3.274l.002.01h-.002v17.49C3.857 22.87 8.052 24 12 24c3.947 0 8.143-1.13 8.143-3.226V3.284h-.002l.002-.01","c":"#8C4FFF"},
    "refresh": {"p":["M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4","M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"]},
    "rocket": {"p":["M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3","M7 14a6 6 0 0 0 -3 6a6 6 0 0 0 6 -3","M15 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"]},
    "route": {"p":["M3 19a2 2 0 1 0 4 0a2 2 0 0 0 -4 0","M19 7a2 2 0 1 0 0 -4a2 2 0 0 0 0 4z","M11 19h5.5a3.5 3.5 0 0 0 0 -7h-8a3.5 3.5 0 0 1 0 -7h4.5"]},
    "server-2": {"p":["M3 4m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z","M3 12m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z","M7 8l0 .01","M7 16l0 .01","M11 8h6","M11 16h6"]},
    "snowflake": {"d":"M24 3.459c0 .646-.418 1.18-1.141 1.18-.723 0-1.142-.534-1.142-1.18 0-.647.419-1.18 1.142-1.18.723 0 1.141.533 1.141 1.18zm-.228 0c0-.533-.38-.951-.913-.951s-.913.38-.913.95c0 .533.38.952.913.952.57 0 .913-.419.913-.951zm-1.37-.533h.495c.266 0 .456.152.456.38 0 .153-.076.229-.19.305l.19.266v.038h-.266l-.19-.266h-.229v.266h-.266zm.495.228h-.229v.267h.229c.114 0 .152-.038.152-.114.038-.077-.038-.153-.152-.153zM7.602 12.4c.038-.151.076-.304.076-.456 0-.114-.038-.228-.038-.342-.114-.343-.304-.647-.646-.838l-4.87-2.777c-.685-.38-1.56-.152-1.94.533-.381.685-.153 1.56.532 1.94l2.701 1.56-2.701 1.56c-.685.38-.913 1.256-.533 1.94.38.685 1.256.914 1.94.533l4.832-2.777c.343-.267.571-.533.647-.876zm1.332 2.626c-.266-.038-.57.038-.837.19l-4.832 2.777c-.685.38-.913 1.256-.532 1.94.38.686 1.255.914 1.94.533l2.701-1.56v3.12c0 .8.647 1.408 1.446 1.408.799 0 1.407-.647 1.407-1.408v-5.592c0-.761-.57-1.37-1.293-1.408zm4.946-6.088c.266.038.57-.038.837-.19l4.832-2.777c.685-.38.913-1.256.532-1.94-.38-.686-1.255-.914-1.94-.533l-2.701 1.56V1.975c0-.799-.647-1.408-1.446-1.408-.799 0-1.446.609-1.446 1.408V7.53c0 .76.609 1.37 1.332 1.407zM3.265 5.97l4.832 2.777c.266.152.533.19.837.19.723-.038 1.331-.684 1.331-1.407V1.975c0-.799-.646-1.408-1.407-1.408-.799 0-1.446.647-1.446 1.408v3.12l-2.701-1.56c-.685-.38-1.56-.152-1.94.533-.419.646-.19 1.521.494 1.902zm9.093 6.011a.412.412 0 00-.114-.266l-.57-.571a.346.346 0 00-.267-.114.412.412 0 00-.266.114l-.571.57a.411.411 0 00-.114.267c0 .076.038.19.114.267l.57.57a.345.345 0 00.267.114c.076 0 .19-.038.266-.114l.571-.57a.412.412 0 00.114-.267zm1.598.533L11.94 14.53c-.039.038-.153.114-.229.114h-.608a.411.411 0 01-.267-.114L8.82 12.514a.408.408 0 01-.076-.229v-.608c0-.076.038-.19.114-.267l2.016-2.016a.41.41 0 01.267-.114h.608a.41.41 0 01.267.114l2.016 2.016a.347.347 0 01.114.267v.608c-.076.077-.114.19-.19.229zm5.593 5.44l-4.832-2.777c-.266-.152-.57-.19-.837-.152-.723.038-1.332.684-1.332 1.408v5.554c0 .8.647 1.408 1.408 1.408.799 0 1.446-.647 1.446-1.408v-3.12l2.7 1.56c.686.38 1.561.152 1.941-.533.419-.646.19-1.521-.494-1.94zm2.549-7.533l-2.701 1.56 2.7 1.56c.686.38.914 1.256.533 1.94-.38.685-1.255.913-1.94.533l-4.832-2.778a1.644 1.644 0 01-.647-.798c-.037-.153-.076-.305-.076-.457 0-.114.039-.228.039-.342.114-.343.342-.647.646-.837l4.832-2.778c.685-.38 1.56-.152 1.94.533.457.609.19 1.484-.494 1.864","c":"#29B5E8"},
    "sparkles": {"p":["M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z"]},
    "terminal-2": {"p":["M8 9l3 3l-3 3","M13 15l3 0","M3 4m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z"]},
    "trino": {"d":"M14.124 16.8529a.1615.1615 0 1 1 .1576.1614.1577.1577 0 0 1-.1576-.1614zm-5.607-.1576a.1614.1614 0 1 0 0 .3228.1614.1614 0 0 0 0-.3228zm10.1341-.6648v1.9869c-.031.5788-.524 1.0237-1.1029.9954h-.3843a5.0596 5.0596 0 0 1-1.1298 1.7178.3192.3192 0 0 0 0 .465l.2382.2191a.3036.3036 0 0 1 .0385.4304c-1.126 1.3835-2.9669 2.1521-5.0498 2.1521a6.575 6.575 0 0 1-4.8192-1.8985c-.0029-.0032-.0059-.0063-.0087-.0096a.6302.6302 0 0 1 .0548-.8896c.137-.1265.1371-.3462 0-.4727a4.944 4.944 0 0 1-1.126-1.714h-.3497c-.5797.0284-1.0737-.416-1.1068-.9954v-1.9869c.0351-.5779.5286-1.02 1.1068-.9915h.2728a5.7648 5.7648 0 0 1 2.0791-3.0936c-.4227-1.0991-1.1529-3.2551-1.226-5.0075C6.0229 4.4705 6.2189.078 7.8253.001c1.6064-.0768 1.3719 4.0275 1.0991 6.6946a32.732 32.732 0 0 0-.123 4.4503 6.994 6.994 0 0 1 2.4826-.4304 7.2414 7.2414 0 0 1 1.7371.2075c.2614-1.2682.8762-3.574 2.0292-5.1958 1.6717-2.352 3.4357-4.7808 4.6116-4.1006 1.176.6802-.3074 3.1398-1.3297 4.4272-1.0222 1.2874-2.7862 3.2089-3.3742 4.2274-.2114.3843-.4304.8032-.5956 1.1529a5.7375 5.7375 0 0 1 2.9169 3.6125h.073v-2.3058a.3075.3075 0 0 0-.1806-.2844.9148.9148 0 0 1-.5573-.8148 1.0184 1.0184 0 0 1 .9045-.9044c.5593-.0598 1.061.3452 1.1208.9044a.9187.9187 0 0 1-.5534.8148.3074.3074 0 0 0-.1691.2844v2.1522a.3113.3113 0 0 0 .1691.2805.9724.9724 0 0 1 .5648.857zm-1.0222-3.9737a.4345.4345 0 0 0 .4612-.4151.4151.4151 0 1 0-.4612.4151zm-.4227 3.4779c.0978.4794.148.9672.1498 1.4565v.3651h.4113a.3228.3228 0 0 0 .3228-.319v-1.0069c-.0111-.2967-.2733-.5256-.5688-.4957h-.3151zm-3.7278-4.481.611.2383a36.6046 36.6046 0 0 1 2.3828-3.8661c1.2874-1.7255 2.3365-3.5817 1.8715-3.8699-.465-.2883-1.6179 1.2297-2.7708 3.109a34.8978 34.8978 0 0 0-2.0945 4.3887zm-4.0544.6726.0154 1.3335c-.0039.2007.1881.3587.3843.3152a6.4317 6.4317 0 0 1 1.4565-.1653 5.995 5.995 0 0 1 1.4527.1729c.1956.0398.3853-.1153.3843-.3151v-1.3412a.319.319 0 0 0-.2421-.3113 6.664 6.664 0 0 0-1.6026-.1845 6.7093 6.7093 0 0 0-1.6025.1845.3188.3188 0 0 0-.246.3113zm1.7063 6.8637v.3843a.6878.6878 0 0 1-.4996.269c-.3074 0-.538-.4189-.538-.4189a.073.073 0 0 0-.1-.0307l-.0024.0013a.0693.0693 0 0 0-.0245.0947c.0115.0231.2806.4957.6649.4957a.7144.7144 0 0 0 .3843-.1268.3267.3267 0 0 1 .3612 0 .8332.8332 0 0 0 .4727.1345.957.957 0 0 0 .6572-.4803.0692.0692 0 0 0-.0269-.0961.0692.0692 0 0 0-.0999.0269c0 .0231-.2191.3843-.5419.4074a.8036.8036 0 0 1-.5765-.269v-.3843a.3154.3154 0 0 1 .1268-.2537c.196-.1499.415-.3958.415-.4919a.538.538 0 0 0-.5764-.4189c-.3766 0-.6533.2498-.6533.4573 0 .1345.2536.3382.4227.4612a.3226.3226 0 0 1 .1346.2383zM7.783 11.6455l.5765-.3074c-.0192-1.126-.0346-3.1436 0-4.5425.0538-2.0368.1537-4.5732-.5226-4.5463S6.6877 4.2285 6.949 7.007a33.0562 33.0562 0 0 0 .834 4.6385zm-3.305 5.3919a.319.319 0 0 0 .319.319h.3997a3.046 3.046 0 0 1 0-.3651 7.546 7.546 0 0 1 .1461-1.4565c-.0493.0002-.34.0005-.3866-.0021a.4881.4881 0 0 0-.4781.4979v1.0068zm.9184 1.4718a5.3254 5.3254 0 0 1-.123-.5573.3228.3228 0 0 0-.319-.2728h-.4957c.0007.0163-.0015.34.0009.355a.5188.5188 0 0 0 .5526.4827l.3842-.0076zm10.1265 2.917-.0884-.0807a.3229.3229 0 0 0-.3843-.0269 6.9823 6.9823 0 0 1-3.8046 1.0068 6.995 6.995 0 0 1-3.7932-1.0068.3228.3228 0 0 0-.3843.0269l-.0884.0807a.3154.3154 0 0 0 0 .4573 6.0305 6.0305 0 0 0 4.2927 1.5988 6.0453 6.0453 0 0 0 4.2889-1.5988.315.315 0 0 0-.0384-.4573zm1.4488-4.4158c0-2.4557-1.1529-4.3273-3.0245-5.2266-.2081-.1022-.4673.0594-.465.2921v1.3297a.3269.3269 0 0 0 .2037.296c1.7332.7109 2.9284 2.1866 2.9284 3.8776 0 2.2712-2.1559 3.8085-5.3419 3.8085-3.1859 0-5.3419-1.5411-5.3419-3.8085 0-1.691 1.1952-3.1667 2.9284-3.8776a.319.319 0 0 0 .2037-.296v-1.322c.0048-.2315-.2536-.3963-.4612-.2921-1.887.8839-3.0399 2.767-3.0399 5.2073 0 2.9899 2.2866 4.996 5.7108 4.996 3.4282.0001 5.6994-2.0098 5.6994-4.9844zm-8.6084-.538h-.0038a.5842.5842 0 1 0 .0038 0zm5.1614.5919c.0063.3226.2615.5789.584.5725a.5842.5842 0 1 0-.584-.5725zm4.5692.6225h-.4996a.3227.3227 0 0 0-.3151.2728c-.0346.173-.0768.3766-.1268.5573.0163.0007.3861-.0014.4012.0009a.5188.5188 0 0 0 .5366-.5004l.0037-.3306z","c":"#DD00A1"},
    "users": {"p":["M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0","M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2","M16 3.13a4 4 0 0 1 0 7.75","M21 21v-2a4 4 0 0 0 -3 -3.85"]},
    "world": {"p":["M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0","M3.6 9h16.8","M3.6 15h16.8","M11.5 3a17 17 0 0 0 0 18","M12.5 3a17 17 0 0 1 0 18"]},
  };

  const QUESTIONS = {
    host: {
      label: "Where does Lightdash run?",
      icon: "cloud",
      options: [
        { id: "cloud", icon: "cloud", title: "Lightdash Cloud", hint: "Hosted by Lightdash" },
        { id: "self", icon: "server-2", title: "Self-hosted", hint: "You deploy and run it" },
      ],
    },
    edition: {
      label: "Which edition are you deploying?",
      icon: "license",
      options: [
        { id: "oss", icon: "lock-open", title: "Open source", hint: "Core features" },
        { id: "ee", icon: "license", title: "Enterprise", hint: "Needs a license key" },
      ],
    },
    model: {
      label: "How is your data modeled?",
      icon: "file-text",
      options: [
        { id: "dbt", icon: "dbt", title: "dbt project", hint: "dbt Core or dbt Cloud" },
        { id: "yaml", icon: "file-code", title: "Lightdash YAML", hint: "Semantic layer without dbt" },
        { id: "none", icon: "sparkles", title: "Not modeled yet", hint: "Query the warehouse with AI first", beta: true },
        { id: "demo", icon: "eye", title: "Just looking", hint: "Try the demo first" },
      ],
    },
    wh: {
      label: "Which warehouse?",
      icon: "plug",
      compact: 3,
      options: [
        { id: "bigquery", icon: "bigquery", title: "BigQuery" },
        { id: "snowflake", icon: "snowflake", title: "Snowflake" },
        { id: "databricks", icon: "databricks", title: "Databricks" },
        { id: "redshift", icon: "redshift", title: "Redshift" },
        { id: "postgres", icon: "postgres", title: "Postgres" },
        { id: "trino", icon: "trino", title: "Trino" },
        { id: "clickhouse", icon: "clickhouse", title: "ClickHouse" },
        { id: "athena", icon: "athena", title: "Athena" },
        { id: "duckdb", icon: "duckdb", title: "DuckDB" },
      ],
    },
    net: {
      label: "Can Lightdash reach your warehouse?",
      icon: "world",
      options: [
        { id: "public", icon: "world", title: "Yes, over the internet", hint: "Possibly behind an IP allow-list" },
        { id: "private", icon: "lock", title: "No, it's in a private network", hint: "VPC or on-prem" },
      ],
    },
    sync: {
      label: "How will Lightdash get your project?",
      icon: "refresh",
      options: [
        { id: "cli-then-git", icon: "git-merge", title: "CLI first, then connect git", hint: "Fastest start; switch to git for production", recommended: true },
        { id: "git", icon: "git-branch", title: "Connect git from the start", hint: "Create the project in the app, connected to your repo", recommended: true },
        { id: "cli", icon: "terminal-2", title: "CLI only", hint: "Quick POC or no repo access; changes need a redeploy" },
        { id: "dbtcloud", icon: "dbt", title: "Connect dbt Cloud", hint: "Connect via git instead unless you need dbt Cloud-only features", dbtOnly: true },
      ],
    },
    git: {
      label: "Which git host?",
      icon: "git-branch",
      compact: 2,
      options: [
        { id: "github", icon: "github", title: "GitHub", anchor: "github", yaml: true },
        { id: "gitlab", icon: "gitlab", title: "GitLab", anchor: "gitlab", yaml: false },
        { id: "bitbucket", icon: "bitbucket", title: "Bitbucket", anchor: "bitbucket", yaml: true },
        { id: "azure", icon: "azure", title: "Azure DevOps", anchor: "azure-devops", yaml: false },
      ],
    },
  };

  const PHASES = {
    deploy: { title: "Deploy", icon: "rocket" },
    explore: { title: "Explore", icon: "player-play" },
    warehouse: { title: "Warehouse", icon: "plug" },
    project: { title: "Project", icon: "file-code" },
    team: { title: "Team", icon: "users" },
  };

  const option = (key, id) => QUESTIONS[key].options.find((o) => o.id === id) || null;

  const optionsFor = (key, a) =>
    QUESTIONS[key].options.filter((o) => {
      if (key === "sync" && o.dbtOnly && a.model === "yaml") return false;
      if (key === "git" && a.model === "yaml" && !o.yaml) return false;
      return true;
    });

  const hasProject = (a) => a.model === "dbt" || a.model === "yaml";

  const visibleFor = (a) => {
    const keys = ["host"];
    if (a.host === "self") keys.push("edition");
    keys.push("model");
    if (a.model && a.model !== "demo") keys.push("wh", "net");
    if (hasProject(a)) keys.push("sync");
    if (hasProject(a) && (a.sync === "cli-then-git" || a.sync === "git")) keys.push("git");
    return keys;
  };

  /* Drop answers that are unknown, filtered out, or no longer on the path.
     Runs on URL values too, so a stale or hand-edited link can't break the page. */
  const normalize = (raw) => {
    let a = {};
    ORDER.forEach((key) => {
      if (raw[key] && option(key, raw[key])) a[key] = raw[key];
    });
    for (let pass = 0; pass < 2; pass += 1) {
      const keys = visibleFor(a);
      const next = {};
      ORDER.forEach((key) => {
        if (!a[key] || !keys.includes(key)) return;
        if (optionsFor(key, a).some((o) => o.id === a[key])) next[key] = a[key];
      });
      a = next;
    }
    return a;
  };

  const [answers, setAnswers] = useState({});
  const [editing, setEditing] = useState(null);
  const [openStep, setOpenStep] = useState(null);
  const [copied, setCopied] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = {};
    ORDER.forEach((key) => {
      const value = params.get(key);
      if (value) fromUrl[key] = value;
    });
    setAnswers(normalize(fromUrl));
    loaded.current = true;
  }, []);

  const queryFor = (a) => {
    const params = new URLSearchParams();
    ORDER.forEach((key) => {
      if (a[key]) params.set(key, a[key]);
    });
    return params.toString();
  };

  /* Sync state to URL after 500ms of inactivity to reduce analytics noise */
  useEffect(() => {
    if (!loaded.current) return undefined;
    const timer = setTimeout(() => {
      const query = queryFor(answers);
      const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
      window.history.replaceState(null, "", url);
    }, 500);
    return () => clearTimeout(timer);
  }, [answers]);

  const a = answers;
  const visible = visibleFor(a);
  const nextKey = visible.find((key) => !a[key]) || null;
  const complete = nextKey === null;

  const choose = (key, id) => {
    setAnswers((prev) => normalize({ ...prev, [key]: id }));
    setEditing(null);
  };

  const startOver = () => {
    setAnswers({});
    setEditing(null);
    setOpenStep(null);
  };

  const copyLink = () => {
    const query = queryFor(a);
    const url = `${window.location.origin}${window.location.pathname}${query ? `?${query}` : ""}`;
    if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* Each step: phase, the question that caused it, title, one line of context,
     and the canonical page for it. */
  const steps = [];
  const add = (phase, why, title, body, href, link) => steps.push({ phase, why, title, body, href, link });
  const wh = option("wh", a.wh);
  const git = option("git", a.git);
  const whTitle = wh ? wh.title : null;
  const isYaml = a.model === "yaml";
  const cliFirst = a.sync === "cli" || a.sync === "cli-then-git";

  if (a.host === "self") {
    if (a.edition === "ee") {
      add("deploy", "edition", "Get your Enterprise license key", "Request a dedicated key from the Lightdash team before you deploy, and apply it to every container.", "/self-host/enterprise-features#get-a-license-key", "Enterprise license keys");
    }
    add("deploy", "host", "Deploy Lightdash", "Work through the production deployment checklist: Tier 1 for an evaluation, Tier 2 before production.", "/self-host/production-deployment-checklist", "Production deployment checklist");
  }

  if (a.model === "demo") {
    add("explore", "model", "Explore the demo project", "See charts, dashboards, and the semantic layer on sample data.", "https://demo.lightdash.com", "demo.lightdash.com");
    add("team", "model", "Invite whoever owns warehouse access", "They can pick up setup from here when you're ready.", "/workspace-admin/invite-new-users", "Invite your team");
  }

  if (a.model && a.model !== "demo") {
    if (wh) {
      add("warehouse", "wh", `Prepare ${whTitle} access`, "Create a read-only service user or role for Lightdash and pick an authentication method.", `${CONNECT}#${a.wh}`, `${whTitle} connection settings`);
    }
    if (a.net === "public" && a.host === "cloud") {
      add("warehouse", "net", "Allow-list Lightdash's IP address", "Needed if your warehouse or firewall restricts inbound traffic.", `${CONNECT}#adding-lightdashs-static-ip-addresses-to-your-allow-list`, "Lightdash Cloud static IPs");
    }
    if (a.net === "private") {
      if (a.wh === "postgres" || a.wh === "redshift") {
        add("warehouse", "net", "Set up an SSH tunnel", "Route the connection through a bastion host in your network.", "/integrations/connect-through-ssh-tunnel", "Connect through an SSH tunnel");
      } else {
        add("warehouse", "net", "Talk to us about private networking", whTitle ? `SSH tunnels support Postgres and Redshift only. For ${whTitle}, contact support about your network setup.` : "SSH tunnels support Postgres and Redshift only. Contact support about your network setup.", "/support", "Get support");
      }
    }
  }

  if (a.model === "none") {
    add("project", "model", "Connect your warehouse and start with Aurora", "Query your warehouse with an AI agent before any models exist, then add a semantic layer later.", "/get-started/agentic-onboarding", "Agentic onboarding");
  }

  if (hasProject(a)) {
    if (isYaml) {
      add("project", "model", "Define your semantic layer in Lightdash YAML", "Add lightdash.config.yml and your model files.", "/semantic-layer/yaml", "Lightdash YAML");
    } else {
      add("project", "model", "Set up your dbt project", "Install the CLI, log in, and generate Tables for the models you want in Lightdash.", `${PREPARE}#set-up-a-dbt-project`, "Set up a dbt project");
    }
    if (cliFirst) {
      add("project", "sync", "Create your project from the CLI", a.sync === "cli-then-git" ? "The fastest way to see your project. You'll switch it to a git connection next." : "Deploy from your machine using your local profile.", isYaml ? "/semantic-layer/yaml" : `${PREPARE}#create-your-project`, isYaml ? "Deploy Lightdash YAML" : "Create your project");
      add("project", "sync", isYaml ? "Add warehouse credentials in the app" : "Switch to a service account", isYaml ? "Lightdash YAML projects deploy without credentials; add them in project settings." : "Replace the credentials copied from your local profile with a shared service account.", `${CONNECT}#1-connect-to-a-warehouse`, "Update connection settings");
    }
    if (a.sync === "git") {
      add("project", "sync", "Create your project in the app", "Go to Organization settings, then All projects, and click Create new.", `${CONNECT}#open-up-your-lightdash-instance-to-get-started`, "Create a project");
      add("project", "sync", whTitle ? `Connect ${whTitle} with a service account` : "Connect your warehouse with a service account", "Enter the warehouse credentials Lightdash uses to run queries.", `${CONNECT}#1-connect-to-a-warehouse`, "Warehouse connection settings");
    }
    if (git && (a.sync === "git" || a.sync === "cli-then-git")) {
      add("project", "git", cliFirst ? `Switch to a ${git.title} connection` : `Connect ${git.title}`, "Point Lightdash at your repository, branch, and project directory.", isYaml ? "/semantic-layer/yaml#connect-through-github" : `${CONNECT}#${git.anchor}`, `${git.title} connection settings`);
      add("project", "git", "Set up CI/CD", "Preview and validate on pull requests, and refresh Lightdash after each merge.", CICD, "Set up CI/CD");
    }
    if (a.sync === "cli") {
      add("project", "sync", "Automate deploys", "CLI projects don't refresh from the UI, so deploy from CI on every merge.", `${CICD}#deploy-changes-to-lightdash`, "Set up CI/CD");
    }
    if (a.sync === "dbtcloud") {
      add("project", "sync", "Connect dbt Cloud", "Create the project in the app and choose dbt Cloud as the connection type.", `${CONNECT}#dbt-cloud`, "dbt Cloud connection settings");
    }
  }

  if (complete && a.model !== "demo") {
    add("team", "done", "Invite your team", "Set allowed email domains and default roles.", "/workspace-admin/invite-new-users", "Invite your team");
    add("team", "done", "Build your first chart", "Explore a Table, add metrics and filters, and save it to a dashboard.", "/get-started/explore-your-data", "Explore your data");
  }

  const phases = [];
  steps.forEach((step, index) => {
    let phase = phases.find((p) => p.id === step.phase);
    if (!phase) {
      phase = { id: step.phase, steps: [] };
      phases.push(phase);
    }
    phase.steps.push({ ...step, number: index + 1 });
  });

  const glyph = (name, size) => {
    const icon = ICONS[name];
    if (!icon) return null;
    if (icon.d) {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={icon.c} aria-hidden="true">
          <path d={icon.d} />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {icon.p.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  };

  const tile = (name, extra) => (
    <span className={`setup-path-tile${ICONS[name] && ICONS[name].dark ? " is-dark" : ""}${extra ? ` ${extra}` : ""}`}>{glyph(name, 20)}</span>
  );

  const because = (step) => (step.why === "done" ? "Part of every setup" : `Because you chose ${option(step.why, a[step.why]).title}`);

  const cards = (key) => {
    const question = QUESTIONS[key];
    const options = optionsFor(key, a);
    const columns = question.compact || (options.length === 3 ? 3 : 2);
    return (
      <div className={`setup-path-options${question.compact ? " is-compact" : ""}`} style={{ "--setup-path-columns": columns }} role="radiogroup" aria-label={question.label}>
        {options.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={a[key] === o.id} className="setup-path-option" onClick={() => choose(key, o.id)}>
            {tile(o.icon)}
            <span className="setup-path-option-text">
              <span className="setup-path-option-title">
                <span>{o.title}</span>
                {o.recommended ? <span className="setup-path-tag">Recommended</span> : null}
                {o.beta ? <Badge color="purple" size="sm" shape="pill">Beta</Badge> : null}
              </span>
              {o.hint ? <span className="setup-path-option-hint">{o.hint}</span> : null}
            </span>
            <span className="setup-path-radio">{glyph("check", 13)}</span>
          </button>
        ))}
      </div>
    );
  };

  const path = (
    <div className="setup-path-result" aria-live="polite">
      <div className="setup-path-result-head">
        <p className="setup-path-result-title">
          Your setup path <span>{steps.length} steps</span>
        </p>
        <button type="button" className="setup-path-ghost" onClick={copyLink}>
          {glyph(copied ? "check" : "link", 15)}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <div className="setup-path-phases">
        {phases.map((phase) => (
          <section key={phase.id} className="setup-path-phase">
            <p className="setup-path-phase-name">
              {glyph(PHASES[phase.id].icon, 17)}
              {PHASES[phase.id].title}
            </p>
            <ol>
              {phase.steps.map((step) => {
                const open = openStep === step.title;
                return (
                  <li key={step.title} className={open ? "is-open" : ""}>
                    <button type="button" aria-expanded={open} onClick={() => setOpenStep(open ? null : step.title)}>
                      <span className="setup-path-step-number">{step.number}</span>
                      <span className="setup-path-step-title">{step.title}</span>
                      <span className="setup-path-chevron">{glyph("chevron-right", 16)}</span>
                    </button>
                    {open ? (
                      <div className="setup-path-step-body">
                        <p>{step.body}</p>
                        <a href={step.href}>
                          {step.link}
                          {glyph("arrow-right", 15)}
                        </a>
                        <span>{because(step)}</span>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );

  return (
    <div className="setup-path not-prose">
      <ol className="setup-path-trunk">
        {visible.map((key) => {
          if (!a[key] && key !== nextKey) return null;
          const question = QUESTIONS[key];
          if (key === nextKey || key === editing) {
            return (
              <li key={key} className="is-current">
                {tile(question.icon)}
                <div className="setup-path-node">
                  <p className="setup-path-question">{question.label}</p>
                  {cards(key)}
                  {key === "sync" ? (
                    <p className="setup-path-note">
                      A git connection is recommended for production. <a href="/integrations/dbt/projects#which-method-should-i-use">Compare sync methods</a>
                    </p>
                  ) : null}
                </div>
              </li>
            );
          }
          const chosen = option(key, a[key]);
          const mine = steps.filter((step) => step.why === key);
          return (
            <li key={key} className="is-done">
              {tile(chosen.icon)}
              <div className="setup-path-node">
                <div className="setup-path-answer">
                  <p>
                    <span>{question.label}</span>
                    <strong>{chosen.title}</strong>
                  </p>
                  <button type="button" className="setup-path-change" onClick={() => setEditing(key)} aria-label={`Change answer: ${question.label}`}>
                    Change
                  </button>
                </div>
                {mine.length ? (
                  <div className="setup-path-leaves">
                    {mine.map((step) => (
                      <a key={step.title} href={step.href}>
                        {glyph("arrow-right", 13)}
                        {step.title}
                      </a>
                    ))}
                  </div>
                ) : null}
                {key === "sync" && a.sync === "dbtcloud" ? (
                  <p className="setup-path-note">
                    We recommend connecting via git repository even if you use dbt Cloud, unless you specifically need dbt Cloud-only features like cross-project references. If you connect via git, set your dbt Cloud environment version to "Compatible".{" "}
                    <a href="/integrations/connect-project#i-m-using-dbt-cloud-should-i-connect-using-my-git-repository-or-through-dbt-cloud">Learn more</a>
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
        {complete ? (
          <li className="is-done is-last">
            {tile("check")}
            <div className="setup-path-node">{path}</div>
          </li>
        ) : (
          <li className="is-pending is-last">
            {tile("route")}
            <div className="setup-path-node">
              <p className="setup-path-pending">{Object.keys(a).length ? "Keep answering to finish your path." : "Answer the first question to start your path."}</p>
            </div>
          </li>
        )}
      </ol>
      {Object.keys(a).length ? (
        <button type="button" className="setup-path-ghost" onClick={startOver}>
          {glyph("refresh", 15)}
          Start over
        </button>
      ) : null}
    </div>
  );
};
