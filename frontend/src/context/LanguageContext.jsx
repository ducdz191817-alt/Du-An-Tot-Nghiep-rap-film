import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  vi: {
    // Nav
    'nav.home': 'Trang chủ',
    'nav.movies': 'Phim',
    'nav.promotions': 'Khuyến mãi',
    'nav.theaters': 'Rạp',
    'nav.about': 'Về chúng tôi',
    'nav.myTickets': 'Vé của tôi',
    'nav.admin': 'Quản trị',
    'nav.login': 'Đăng nhập',
    'nav.register': 'Đăng ký',
    'nav.logout': 'Đăng xuất',
    'nav.bookNow': 'Đặt vé',

    // Home
    'home.featured': 'Phim Nổi Bật',
    'home.bookNow': 'Đặt Vé Ngay',
    'home.watchTrailer': 'Xem Trailer',
    'home.discover': 'Khám Phá Phim',
    'home.loadingError': 'Lỗi khi tải danh sách phim',

    // Footer
    'footer.desc': 'Tận hưởng trải nghiệm đặt vé xem phim tuyệt vời. Lựa chọn ghế ngồi ưng ý, đồ ăn vặt hấp dẫn và thanh toán an toàn chỉ với vài cú nhấp chuột.',
    'footer.explore': 'Khám phá',
    'footer.nowShowing': 'Phim đang chiếu',
    'footer.comingSoon': 'Phim sắp chiếu',
    'footer.theaters': 'Hệ thống rạp',
    'footer.promotions': 'Khuyến mãi',
    'footer.support': 'Hỗ trợ & Pháp lý',
    'footer.terms': 'Điều khoản sử dụng',
    'footer.refund': 'Chính sách hoàn tiền',
    'footer.faq': 'Câu hỏi thường gặp',
    'footer.privacy': 'Bảo mật thông tin',
    'footer.contact': 'Liên hệ',
    'footer.rights': 'Bảo lưu mọi quyền.',

    // Movie details labels
    'movie.backToCatalog': 'Quay lại danh mục',
    'movie.synopsis': 'Tóm tắt',
    'movie.director': 'Đạo diễn',
    'movie.languageLabel': 'Ngôn ngữ',
    'movie.cast': 'Diễn viên',
    'movie.trailer': 'Trailer chính thức',
    'movie.bookShowtimes': 'Đặt lịch chiếu',
    'movie.loadingShowtimes': 'Đang tải lịch chiếu...',
    'movie.noShowtimes': 'Không có lịch chiếu vào ngày này. Vui lòng chọn ngày khác!',
    'movie.formats': 'Định dạng Tiêu chuẩn & Cao cấp',
    'movie.errorLoad': 'Không thể tải thông tin chi tiết phim',
    'movie.backToHome': 'Trở về trang chủ',

    // Genres
    'Action': 'Hành động',
    'Sci-Fi': 'Viễn tưởng',
    'Adventure': 'Phiêu lưu',
    'Comedy': 'Hài hước',
    'Family': 'Gia đình',
    'Drama': 'Chính kịch',
    'Horror': 'Kinh dị',
    'Animation': 'Hoạt hình',
    'Fantasy': 'Kỳ ảo',
    'Romance': 'Lãng mạn',
    'Thriller': 'Giật gân',
    'Mystery': 'Bí ẩn',
    'Crime': 'Tội phạm',
    'Biography': 'Tiểu sử',
    'History': 'Lịch sử',
    'Sport': 'Thể thao',
    'Musical': 'Âm nhạc',
    'War': 'Chiến tranh',
    'Documentary': 'Tài liệu',

    // ── MOVIE TITLES & DESCRIPTIONS (VI) ──────────────────────────────────────

    // Avengers
    'Avengers: Secret Wars': 'Avengers: Secret Wars',
    'Avengers: Secret Wars.desc': 'Sau các sự kiện của Endgame, các anh hùng Marvel đối mặt với mối đe dọa lớn nhất từ trước đến nay khi các thực tại song song va chạm, buộc họ phải liên minh với những phiên bản khác của chính mình.',

    // Minecraft
    'Minecraft: The Movie': 'Minecraft: The Movie',
    'Minecraft: The Movie.desc': 'Bốn người lạ mặt và một thú mỏ vịt bất ngờ bị hút vào thế giới Minecraft đầy khối vuông và nguy hiểm. Họ phải học cách sinh tồn và tìm đường về nhà.',

    // Thunderbolts
    'Thunderbolts*': 'Thunderbolts*',
    'Thunderbolts*.desc': 'Một nhóm các nhân vật phản diện và anh hùng sa ngã của Marvel được tập hợp lại để thực hiện nhiệm vụ tối mật. Khi mọi thứ sụp đổ, họ phải lựa chọn giữa sứ mệnh và lương tâm.',

    // Lilo & Stitch
    'Lilo & Stitch': 'Lilo & Stitch',
    'Lilo & Stitch.desc': 'Phiên bản live-action của bộ phim hoạt hình kinh điển Disney. Lilo, một cô bé Hawaii cô đơn, kết bạn với một sinh vật ngoài hành tinh tên Stitch và cùng nhau học về ý nghĩa của gia đình.',

    // Hoa Vàng
    'Tôi Thấy Hoa Vàng Trên Cỏ Xanh 2': 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh 2',
    'Tôi Thấy Hoa Vàng Trên Cỏ Xanh 2.desc': 'Tiếp nối câu chuyện tuổi thơ đong đầy cảm xúc, hai anh em Thiều và Tường trưởng thành hơn trong hành trình tìm kiếm bản thân giữa vùng quê yên bình miền Trung.',

    // Superman
    'Superman: Legacy': 'Superman: Legacy',
    'Superman: Legacy.desc': 'James Gunn tái khởi động vũ trụ DC với câu chuyện về Superman trẻ tuổi Clark Kent, người đang cố gắng cân bằng di sản Krypton và cuộc sống con người trên Trái Đất.',

    // Jurassic World
    'Jurassic World: Rebirth': 'Jurassic World: Rebirth',
    'Jurassic World: Rebirth.desc': 'Năm năm sau thảm họa toàn cầu, ba nhóm người sống sót phải hợp tác để truy tìm mẫu ADN khủng long quý giá có thể cứu nhân loại. Nhưng những loài ăn thịt nguyên thủy nhất đang chờ đợi họ.',

    // Cám
    'Cám': 'Cám',
    'Cám.desc': 'Phiên bản kinh dị Việt Nam của câu chuyện cổ tích Tấm Cám. Cám xinh đẹp nhưng độc ác sẵn sàng làm mọi thứ để giành được cuộc sống mà mình ao ước, kể cả những điều không thể tưởng tượng.',

    // Dune
    'Dune: Part Two': 'Dune: Phần Hai',
    'Dune: Part Two.desc': 'Paul Atreides liên minh với người Fremen và thực hiện hành trình báo thù những kẻ âm mưu hủy diệt gia đình mình. Khi anh phải lựa chọn giữa tình yêu và định mệnh của vũ trụ.',

    // Kung Fu Panda
    'Kung Fu Panda 4': 'Kung Fu Panda 4',
    'Kung Fu Panda 4.desc': 'Po được bổ nhiệm làm Lãnh đạo Tinh thần của Thung lũng Hòa bình, nhưng trước tiên phải tìm và đào tạo một Chiến binh Rồng mới. Hành trình đưa anh đến một thành phố ven biển nguy hiểm.',

    // Doctor Strange
    'Doctor Strange in the Multiverse of Madness': 'Bác Sĩ Kỳ Lạ: Đa Vũ Trụ Hỗn Loạn',
    'Doctor Strange in the Multiverse of Madness.desc': 'Bác Sĩ Strange cùng một cô thiếu niên bí ẩn có khả năng di chuyển giữa các vũ trụ song song phải đương đầu với vô số mối nguy hiểm, bao gồm các phiên bản thay thế của chính họ đang đe dọa xóa sổ hàng triệu sinh mạng.',

    // Spider-Man
    'Spider-Man: No Way Home': 'Người Nhện: Không Có Đường Về',
    'Spider-Man: No Way Home.desc': 'Peter Parker nhờ Bác Sĩ Strange thực hiện phép thuật để thế giới quên đi danh tính người Nhện của anh, nhưng phép thuật mở ra đa vũ trụ, triệu hồi những kẻ phản diện nguy hiểm nhất.',

    // Black Panther
    'Black Panther: Wakanda Forever': 'Chiến Binh Báo Đen: Wakanda Bất Diệt',
    'Black Panther: Wakanda Forever.desc': 'Sau khi mất đi vị vua T\'Challa, người dân Wakanda phải bảo vệ đất nước khỏi sự xâm lược của Namor và vương quốc Talokan dưới lòng đại dương.',

    // Thor
    'Thor: Love and Thunder': 'Thor: Tình Yêu Và Sấm Sét',
    'Thor: Love and Thunder.desc': 'Thor bắt đầu hành trình tìm kiếm sự bình yên, nhưng phải đối mặt với Gorr kẻ giết thần linh đang tìm cách tiêu diệt tất cả các vị thần. Jane Foster trở thành Nữ Thor huyền thoại.',

    // Shang-Chi
    'Shang-Chi and the Legend of the Ten Rings': 'Shang-Chi Và Huyền Thoại Thập Nhẫn',
    'Shang-Chi and the Legend of the Ten Rings.desc': 'Shang-Chi bị kéo vào thế giới bí ẩn của tổ chức Thập Nhẫn và phải đối đầu với chính người cha quyền năng của mình, đồng thời khám phá bí mật về quá khứ của gia đình.',

    // Eternals
    'Eternals': 'Eternals',
    'Eternals.desc': 'Nhóm anh hùng bất tử Eternals tái hợp sau hàng nghìn năm để bảo vệ Trái Đất khỏi kẻ thù cổ xưa nhất của họ - các Deviant đột biến nguy hiểm.',

    // Encanto
    'Encanto': 'Encanto',
    'Encanto.desc': 'Gia đình Madrigal sống trong một ngôi nhà thần kỳ ở vùng núi Colombia, nơi mỗi người đều có một phép năng đặc biệt - trừ Mirabel. Khi phép màu của ngôi nhà bắt đầu biến mất, chỉ có cô mới có thể cứu gia đình.',

    // The Batman
    'The Batman': 'Người Dơi',
    'The Batman.desc': 'Batman bước vào năm thứ hai làm người bảo vệ Gotham, buộc phải điều tra tội ác gây ra bởi kẻ giết người hàng loạt tên Riddler, dần khám phá sự thối nát ăn sâu vào thành phố.',

    // Top Gun
    'Top Gun: Maverick': 'Phi Công Siêu Đẳng: Maverick',
    'Top Gun: Maverick.desc': 'Sau hơn 30 năm phục vụ, Pete "Maverick" Mitchell trở lại huấn luyện thế hệ phi công trẻ của Top Gun cho một nhiệm vụ đặc biệt đòi hỏi sự hy sinh cực đại.',

    // Avatar
    'Avatar: The Way of Water': 'Avatar: Dòng Chảy Của Nước',
    'Avatar: The Way of Water.desc': 'Jake Sully và Neytiri cùng gia đình phải rời bỏ ngôi nhà và khám phá các vùng đất của Pandora. Khi mối nguy hiểm cổ đại tái xuất, họ phải chiến đấu để bảo vệ nhau.',

    // Fast X
    'Fast X': 'Fast X',
    'Fast X.desc': 'Dominic Toretto và gia đình phải đối mặt với Dante - kẻ thù nguy hiểm và lâu đời nhất từ trước đến nay, người đã lên kế hoạch trả thù suốt nhiều thập kỷ.',

    // Mission Impossible
    'Mission: Impossible – Dead Reckoning Part One': 'Nhiệm Vụ Bất Khả Thi: Phần 1',
    'Mission: Impossible – Dead Reckoning Part One.desc': 'Ethan Hunt và đội IMF phải truy đuổi một vũ khí có thể đe dọa toàn nhân loại trước khi nó rơi vào tay kẻ xấu.',

    // Guardians
    'Guardians of the Galaxy Vol. 3': 'Những Vệ Binh Dải Ngân Hà Vol. 3',
    'Guardians of the Galaxy Vol. 3.desc': 'Peter Quill và nhóm Guardians lên đường bảo vệ Rocket trước quá khứ bí ẩn của anh. Hành trình sẽ thách thức nhóm đến giới hạn và có thể dẫn đến sự tan rã của họ.',

    // Oppenheimer
    'Oppenheimer': 'Oppenheimer',
    'Oppenheimer.desc': 'Câu chuyện về J. Robert Oppenheimer - nhà vật lý người Mỹ đã đóng vai trò then chốt trong việc phát triển bom nguyên tử đầu tiên trong Dự án Manhattan.',

    // Barbie
    'Barbie': 'Barbie',
    'Barbie.desc': 'Barbie sống trong thế giới hoàn hảo Barbieland bỗng dưng phải đối mặt với những khủng hoảng hiện sinh và bắt đầu một hành trình vào thế giới thực.',

    // Inside Out
    'Inside Out 2': 'Những Mảnh Ghép Cảm Xúc 2',
    'Inside Out 2.desc': 'Riley bước vào tuổi thiếu niên và một loạt cảm xúc mới xuất hiện trong tâm trí cô bé, tạo ra sự hỗn loạn chưa từng có giữa Joy và những người bạn cũ.',

    // Deadpool
    'Deadpool & Wolverine': 'Deadpool & Wolverine',
    'Deadpool & Wolverine.desc': 'Deadpool được tuyển vào TVA và cùng Wolverine thực hiện sứ mệnh quan trọng có thể thay đổi lịch sử Marvel mãi mãi.',

    // Moana
    'Moana 2': 'Moana 2',
    'Moana 2.desc': 'Moana lên đường chinh phục vùng biển chưa được khám phá khi nhận được lời kêu gọi từ tổ tiên. Cô tập hợp thủy thủ đoàn và cùng nhau đối mặt với vùng biển đầy bí ẩn và nguy hiểm.',

    // Wicked
    'Wicked': 'Wicked',
    'Wicked.desc': 'Câu chuyện về tình bạn bất ngờ giữa Elphaba - cô gái da xanh bị xa lánh - và Glinda - cô gái nổi tiếng và quyến rũ - tại trường phù thủy Shiz trước khi trở thành hai phù thủy huyền thoại của Oz.',

    // Alien Romulus
    'Alien: Romulus': 'Alien: Romulus',
    'Alien: Romulus.desc': 'Một nhóm thanh niên trên thuộc địa không gian đối mặt với dạng sống nguy hiểm nhất trong vũ trụ khi khám phá một trạm không gian bị bỏ hoang giữa các vì sao.',

    // Joker 2
    'Joker: Folie à Deux': 'Joker: Điên Cùng Nhau',
    'Joker: Folie à Deux.desc': 'Arthur Fleck đang bị giam giữ tại Arkham trong khi đối mặt với phiên tòa về những tội ác của mình. Tại đây anh gặp Harley Quinn và cả hai cùng nhau bước vào câu chuyện tình yêu điên loạn.',

    // Twisters
    'Twisters': 'Lốc Xoáy',
    'Twisters.desc': 'Các chuyên gia theo dõi cơn lốc xoáy phải đối mặt với mùa bão khốc liệt nhất từ trước đến nay khi những cơn lốc siêu mạnh tấn công vùng đồng bằng Mỹ.',

    // A Quiet Place
    'A Quiet Place: Day One': 'Vùng Đất Câm Lặng: Ngày Đầu Tiên',
    'A Quiet Place: Day One.desc': 'Câu chuyện về những ngày đầu tiên khi thế giới bị chiếm đóng bởi những sinh vật săn mồi theo âm thanh, theo dõi hành trình sinh tồn của người phụ nữ tên Sam tại New York.',

    // Transformers
    'Transformers One': 'Transformers One',
    'Transformers One.desc': 'Nguồn gốc chưa từng được kể về Optimus Prime và Megatron - từ những người bạn tốt nhất trên Cybertron đến kẻ thù không đội trời chung đã thay đổi lịch sử vũ trụ mãi mãi.',

    // The Wild Robot
    'The Wild Robot': 'Robot Hoang Dã',
    'The Wild Robot.desc': 'Robot ROZZUM đơn vị 7134 bị mắc kẹt trên một hòn đảo hoang và phải học cách thích nghi với thiên nhiên. Cô nhận nuôi một chú ngỗng mồ côi và dần khám phá ý nghĩa của tình mẫu tử.',

    // Venom
    'Venom: The Last Dance': 'Venom: Điệu Nhảy Cuối Cùng',
    'Venom: The Last Dance.desc': 'Eddie Brock và Venom bị truy đuổi bởi cả hai thế giới con người và cộng sinh. Họ phải đưa ra quyết định tối thượng đặt dấu chấm hết cho câu chuyện của cả hai.',

    // ── MOVIE LANGUAGES (VI) ──────────────────────────────────────────────────
    'Tiếng Anh': 'Tiếng Anh',
    'Tiếng Việt': 'Tiếng Việt',
    'English with Vietnamese Subtitles': 'Tiếng Anh kèm Phụ đề Tiếng Việt',
    'Tiếng Anh kèm Phụ đề Tiếng Việt': 'Tiếng Anh kèm Phụ đề Tiếng Việt',
    'English': 'Tiếng Anh',
    'Vietnamese': 'Tiếng Việt',
    'Korean': 'Tiếng Hàn',
    'Japanese': 'Tiếng Nhật',
    'French': 'Tiếng Pháp',
    'Chinese': 'Tiếng Trung',
    'Tiếng Hàn': 'Tiếng Hàn',
    'Tiếng Nhật': 'Tiếng Nhật',
    'Tiếng Pháp': 'Tiếng Pháp',
    'Tiếng Trung': 'Tiếng Trung',

    // Reviews
    'review.title': 'Đánh Giá & Bình Luận',
    'review.writeReview': 'Viết đánh giá',
    'review.writeTitle': 'Viết đánh giá của bạn',
    'review.editTitle': 'Chỉnh sửa đánh giá',
    'review.yourRating': 'Đánh giá của bạn',
    'review.yourComment': 'Bình luận',
    'review.commentPlaceholder': 'Chia sẻ cảm nhận của bạn về bộ phim này...',
    'review.submitBtn': 'Gửi đánh giá',
    'review.updateBtn': 'Cập nhật',
    'review.cancelBtn': 'Hủy',
    'review.edit': 'Sửa',
    'review.delete': 'Xóa',
    'review.confirmDelete': 'Bạn có chắc chắn muốn xóa đánh giá này?',
    'review.errorNoRating': 'Vui lòng chọn số sao đánh giá',
    'review.errorNoComment': 'Vui lòng nhập nội dung bình luận',
    'review.errorGeneral': 'Đã xảy ra lỗi, vui lòng thử lại',
    'review.reviews': 'đánh giá',
    'review.noReviews': 'Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá phim này!',
    'review.loading': 'Đang tải đánh giá...',
    'review.loginPrompt': 'Đăng nhập để viết đánh giá phim',
    'review.adminNotice': 'Tài khoản quản trị viên không thể viết đánh giá. Chỉ người dùng thường mới có quyền đánh giá phim.',

    // Booking History Page (My Tickets)
    'history.title': 'Lịch sử đặt vé',
    'history.subtitle': 'Xem lại vé đã đặt, đơn bắp nước và chi tiết giao dịch của bạn.',
    'history.noBookings': 'Bạn chưa đặt vé nào.',
    'history.findMovies': 'Tìm phim',
    'history.payment.card': 'Thẻ tín dụng / Ghi nợ',
    'history.payment.momo': 'Ví MoMo',
    'history.payment.vnpay': 'Ví VNPay',
    'history.status.paid': 'Đã thanh toán',
    'history.status.pending': 'Chờ xử lý',
    'history.status.refunded': 'Đã hoàn tiền',
    'history.unknownTime': 'Thời gian chưa xác định',
    'history.noSeats': 'Chưa chọn ghế',
    'history.totalPayment': 'Tổng thanh toán',
    'history.collapse': 'Thu gọn',
    'history.viewDetails': 'Xem chi tiết',
    'history.selectedSeats': 'Ghế đã chọn',
    'history.concessions': 'Đồ ăn uống',
    'history.paymentMethod': 'Phương thức thanh toán',
    'history.bookingId': 'Mã đặt vé',
    'history.bookedAt': 'Đặt lúc:',
    'history.total': 'Tổng cộng',
    'history.unknownTheater': 'Không rõ rạp',
    'history.unknownRoom': 'Không rõ phòng',
    'history.movieDeleted': 'Phim đã bị xóa hoặc không còn tồn tại',

    // Promotions Page
    'promo.specialOffer': 'Ưu đãi đặc biệt',
    'promo.title': 'Khuyến Mãi Hấp Dẫn',
    'promo.subtitle': 'Săn ưu đãi, sao chép mã giảm giá và tận hưởng trải nghiệm xem phim tuyệt vời với chi phí tiết kiệm nhất.',
    'promo.activeCodes': 'Mã đang hoạt động',
    'promo.maxSavings': 'Tiết kiệm tối đa',
    'promo.weeklyUpdate': 'Cập nhật hàng tuần',
    'promo.allOffers': 'Tất cả ưu đãi',
    'promo.howToUse': 'Cách sử dụng mã khuyến mãi',
    'promo.step1': 'Chọn phim',
    'promo.step1Desc': 'Duyệt danh sách phim và chọn suất chiếu bạn muốn xem.',
    'promo.step2': 'Chọn ghế',
    'promo.step2Desc': 'Chọn ghế yêu thích và thêm bắp nước nếu muốn.',
    'promo.step3': 'Nhập mã',
    'promo.step3Desc': 'Sao chép và dán mã khuyến mãi vào ô nhập khi thanh toán.',
    'promo.step4': 'Tận hưởng',
    'promo.step4Desc': 'Hoàn tất đặt vé và tận hưởng bộ phim với giá ưu đãi!',
    'promo.minOrderLabel': 'Đơn tối thiểu:',
    'promo.copied': 'Đã sao chép!',
    'countdown.days': 'ngày',
    'countdown.hours': 'giờ',
    'countdown.minutes': 'phút',
    'countdown.seconds': 'giây',
    // Filters & Sorting
    'filter.nowShowing': 'Đang chiếu',
    'filter.comingSoon': 'Sắp chiếu',
    'filter.preview': 'Chiếu sớm',
    'filter.preRelease': 'Sắp ra mắt',
    'filter.searchPlaceholder': 'Tìm tên phim...',
    'filter.allGenres': 'Tất cả thể loại',
    'filter.selectedGenres': 'đã chọn',
    'filter.ratingAll': 'Tất cả đánh giá',
    'filter.ratingAbove4.5': 'Từ 4.5★ trở lên',
    'filter.ratingAbove4.0': 'Từ 4.0★ trở lên',
    'filter.ratingAbove3.0': 'Từ 3.0★ trở lên',
    'filter.sortBy': 'Sắp xếp theo',
    'filter.sort.newest': 'Mới nhất',
    'filter.sort.rating': 'Đánh giá cao nhất',
    'filter.sort.durationAsc': 'Thời lượng tăng dần',
    'filter.sort.durationDesc': 'Thời lượng giảm dần',
    'filter.sort.titleAZ': 'Tên phim (A-Z)',
    'filter.clearAll': 'Xóa bộ lọc',
    'movies.title': 'Danh mục phim',
    'movies.subtitle': 'Duyệt danh sách phim đang chiếu hoặc xem trước các phim sắp ra mắt.',
    // Showtime filters & sorting
    'showtime.sortBy': 'Sắp xếp',
    'showtime.sort.earliest': 'Giờ chiếu (Sớm nhất)',
    'showtime.sort.latest': 'Giờ chiếu (Muộn nhất)',
    'showtime.format': 'Định dạng',
    'showtime.format.all': 'Tất cả',
    'showtime.started': 'Đã bắt đầu',
    'showtime.alertPastShowtime': 'Suất chiếu này đã bắt đầu hoặc đã kết thúc. Vui lòng chọn suất chiếu khác.',
  },

  en: {
    // Nav
    'nav.home': 'Home',
    'nav.movies': 'Movies',
    'nav.promotions': 'Promotions',
    'nav.theaters': 'Theaters',
    'nav.about': 'About Us',
    'nav.myTickets': 'My Tickets',
    'nav.admin': 'Admin',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.logout': 'Logout',
    'nav.bookNow': 'Book Now',

    // Home
    'home.featured': 'Featured Movie',
    'home.bookNow': 'Book Ticket Now',
    'home.watchTrailer': 'Watch Trailer',
    'home.discover': 'Discover Movies',
    'home.loadingError': 'Error loading movie list',

    // Footer
    'footer.desc': 'Enjoy the ultimate movie ticket booking experience. Select your preferred seats, delicious snacks, and pay securely in just a few clicks.',
    'footer.explore': 'Explore',
    'footer.nowShowing': 'Now Showing',
    'footer.comingSoon': 'Coming Soon',
    'footer.theaters': 'Theaters',
    'footer.promotions': 'Promotions',
    'footer.support': 'Support & Legal',
    'footer.terms': 'Terms of Use',
    'footer.refund': 'Refund Policy',
    'footer.faq': 'FAQ',
    'footer.privacy': 'Privacy Policy',
    'footer.contact': 'Contact',
    'footer.rights': 'All rights reserved.',

    // Movie details labels
    'movie.backToCatalog': 'Back to catalog',
    'movie.synopsis': 'Synopsis',
    'movie.director': 'Director',
    'movie.languageLabel': 'Language',
    'movie.cast': 'Cast',
    'movie.trailer': 'Official Trailer',
    'movie.bookShowtimes': 'Book Showtimes',
    'movie.loadingShowtimes': 'Loading available slots...',
    'movie.noShowtimes': 'No showtimes registered on this day. Please check another date!',
    'movie.formats': 'Standard & Premium Formats',
    'movie.errorLoad': 'Failed to load movie details',
    'movie.backToHome': 'Back to homepage',

    // Genres
    'Action': 'Action',
    'Sci-Fi': 'Sci-Fi',
    'Adventure': 'Adventure',
    'Comedy': 'Comedy',
    'Family': 'Family',
    'Drama': 'Drama',
    'Horror': 'Horror',
    'Animation': 'Animation',
    'Fantasy': 'Fantasy',
    'Romance': 'Romance',
    'Thriller': 'Thriller',
    'Mystery': 'Mystery',
    'Crime': 'Crime',
    'Biography': 'Biography',
    'History': 'History',
    'Sport': 'Sport',
    'Musical': 'Musical',
    'War': 'War',
    'Documentary': 'Documentary',

    // ── MOVIE TITLES & DESCRIPTIONS (EN) ──────────────────────────────────────

    // Avengers
    'Avengers: Secret Wars': 'Avengers: Secret Wars',
    'Avengers: Secret Wars.desc': 'Following the events of Endgame, the Marvel heroes face their greatest threat yet as parallel realities collide, forcing them to ally with alternate versions of themselves.',

    // Minecraft
    'Minecraft: The Movie': 'Minecraft: The Movie',
    'Minecraft: The Movie.desc': 'Four misfits and a platypus find themselves pulled into the cubical and perilous world of Minecraft. They must learn to survive and find their way home.',

    // Thunderbolts
    'Thunderbolts*': 'Thunderbolts*',
    'Thunderbolts*.desc': 'A group of reformed villains and fallen heroes from Marvel are assembled for a top-secret mission. When everything crumbles, they must choose between their directive and their conscience.',

    // Lilo & Stitch
    'Lilo & Stitch': 'Lilo & Stitch',
    'Lilo & Stitch.desc': 'Live-action adaptation of the classic Disney animated film. Lilo, a lonely Hawaiian girl, befriends an alien creature named Stitch, and together they learn the meaning of family.',

    // Hoa Vàng
    'Tôi Thấy Hoa Vàng Trên Cỏ Xanh 2': 'Yellow Flowers on the Green Grass 2',
    'Tôi Thấy Hoa Vàng Trên Cỏ Xanh 2.desc': 'Continuing the emotional childhood story, brothers Thieu and Tuong grow older in their journey to find themselves amidst the peaceful countryside of Central Vietnam.',

    // Superman
    'Superman: Legacy': 'Superman: Legacy',
    'Superman: Legacy.desc': 'James Gunn reboots the DC Universe with the story of a young Superman, Clark Kent, as he strives to balance his Kryptonian heritage with his human upbringing on Earth.',

    // Jurassic World
    'Jurassic World: Rebirth': 'Jurassic World: Rebirth',
    'Jurassic World: Rebirth.desc': 'Five years after a global disaster, three groups of survivors must cooperate to retrieve a precious dinosaur DNA sample that could save humanity. But the most primal carnivores await them.',

    // Cám
    'Cám': 'Cam: The Dark Tale',
    'Cám.desc': 'A Vietnamese horror adaptation of the classic fairy tale Tam Cam. Cam, beautiful but cruel, is willing to do whatever it takes to win the life she desires, including the unthinkable.',

    // Dune
    'Dune: Part Two': 'Dune: Part Two',
    'Dune: Part Two.desc': 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.',

    // Kung Fu Panda
    'Kung Fu Panda 4': 'Kung Fu Panda 4',
    'Kung Fu Panda 4.desc': 'Po is tapped to become the Spiritual Leader of the Valley of Peace, but must first find and train a new Dragon Warrior. The journey takes him to a dangerous coastal city.',

    // Doctor Strange
    'Doctor Strange in the Multiverse of Madness': 'Doctor Strange in the Multiverse of Madness',
    'Doctor Strange in the Multiverse of Madness.desc': 'Doctor Strange teams up with a mysterious teenage girl from his dreams who can travel across multiverses, to battle multiple threats, including alternate-universe versions of himself, which threaten to wipe out millions across the multiverse.',

    // Spider-Man
    'Spider-Man: No Way Home': 'Spider-Man: No Way Home',
    'Spider-Man: No Way Home.desc': 'Peter Parker seeks help from Doctor Strange to make the world forget he is Spider-Man, but the spell opens the multiverse, summoning the most dangerous villains from alternate realities.',

    // Black Panther
    'Black Panther: Wakanda Forever': 'Black Panther: Wakanda Forever',
    'Black Panther: Wakanda Forever.desc': "After losing King T'Challa, the people of Wakanda must protect their nation from the invasion of Namor and the underwater kingdom of Talokan.",

    // Thor
    'Thor: Love and Thunder': 'Thor: Love and Thunder',
    'Thor: Love and Thunder.desc': 'Thor embarks on a journey of self-discovery but must interrupt it to face Gorr the God Butcher, who seeks to make the gods extinct. Along the way, Jane Foster wields Mjolnir as the Mighty Thor.',

    // Shang-Chi
    'Shang-Chi and the Legend of the Ten Rings': 'Shang-Chi and the Legend of the Ten Rings',
    'Shang-Chi and the Legend of the Ten Rings.desc': "Shang-Chi is drawn into the world of the Ten Rings and must confront his powerful father while uncovering secrets about his family's past.",

    // Eternals
    'Eternals': 'Eternals',
    'Eternals.desc': 'The immortal Eternals reunite after thousands of years to protect Earth from their ancient enemies — the mutated and dangerous Deviants.',

    // Encanto
    'Encanto': 'Encanto',
    'Encanto.desc': "The Madrigal family lives in a magical house in the mountains of Colombia, where every family member has a unique gift—except Mirabel. When the house's magic starts fading, only she can save the family.",

    // The Batman
    'The Batman': 'The Batman',
    'The Batman.desc': "In his second year of fighting crime, Batman uncovers corruption in Gotham City while investigating a series of sadistic killings orchestrated by a mysterious murderer known as the Riddler.",

    // Top Gun
    'Top Gun: Maverick': 'Top Gun: Maverick',
    'Top Gun: Maverick.desc': 'After more than 30 years of service, Pete "Maverick" Mitchell returns to train a group of Top Gun graduates for a specialized mission requiring the ultimate sacrifice.',

    // Avatar
    'Avatar: The Way of Water': 'Avatar: The Way of Water',
    'Avatar: The Way of Water.desc': 'Jake Sully and Neytiri form a family and do what it takes to stay together. When trouble resurfaces, they must leave their home and explore the regions of Pandora.',

    // Fast X
    'Fast X': 'Fast X',
    'Fast X.desc': "Dom Toretto and his family face Dante, the most ruthless villain they've ever encountered, a man who has been plotting revenge for decades.",

    // Mission Impossible
    'Mission: Impossible – Dead Reckoning Part One': 'Mission: Impossible – Dead Reckoning Part One',
    'Mission: Impossible – Dead Reckoning Part One.desc': 'Ethan Hunt and the IMF team race against time to track down a terrifying new weapon that threatens all of humanity before it falls into the wrong hands.',

    // Guardians
    'Guardians of the Galaxy Vol. 3': 'Guardians of the Galaxy Vol. 3',
    'Guardians of the Galaxy Vol. 3.desc': "Peter Quill rallies his team to defend Rocket from his past. The journey will challenge the Guardians to their limits and may lead to the team's disbandment.",

    // Oppenheimer
    'Oppenheimer': 'Oppenheimer',
    'Oppenheimer.desc': "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II and the Manhattan Project.",

    // Barbie
    'Barbie': 'Barbie',
    'Barbie.desc': 'Barbie suffers a crisis that leads her to question her world, and she sets off on a journey into the real world.',

    // Inside Out
    'Inside Out 2': 'Inside Out 2',
    'Inside Out 2.desc': 'Riley enters her teenage years and a new set of Emotions show up just in time to cause havoc over a very important weekend.',

    // Deadpool
    'Deadpool & Wolverine': 'Deadpool & Wolverine',
    'Deadpool & Wolverine.desc': 'Deadpool is recruited by the TVA and teams up with Wolverine on a mission that could change the history of the Marvel Cinematic Universe forever.',

    // Moana
    'Moana 2': 'Moana 2',
    'Moana 2.desc': 'Moana sets sail on a daring mission to a mysterious and magical region of the ocean, responding to an ancestral call. She crews an unlikely group of seafarers on an impossible journey.',

    // Wicked
    'Wicked': 'Wicked',
    'Wicked.desc': 'The story of the unlikely friendship between Elphaba — a misunderstood young woman with emerald-green skin — and Glinda, a popular and ambitious girl, long before they became the Wicked Witch and Glinda the Good.',

    // Alien Romulus
    'Alien: Romulus': 'Alien: Romulus',
    'Alien: Romulus.desc': 'A group of young people on a deep space colony planet come face to face with the most terrifying life form in the universe while searching an abandoned space station.',

    // Joker 2
    'Joker: Folie à Deux': 'Joker: Folie à Deux',
    'Joker: Folie à Deux.desc': 'Arthur Fleck is incarcerated at Arkham while awaiting trial for his crimes. He comes across Harley Quinn and together they embark on a musical love story.',

    // Twisters
    'Twisters': 'Twisters',
    'Twisters.desc': 'Storm trackers confront the most extreme tornado season in recorded history when terrifying tornadoes tear across the American plains.',

    // A Quiet Place
    'A Quiet Place: Day One': 'A Quiet Place: Day One',
    'A Quiet Place: Day One.desc': 'A story about the earliest days of the invasion of the sound-hunting creatures, following a woman named Sam through New York City on Day One of the apocalypse.',

    // Transformers
    'Transformers One': 'Transformers One',
    'Transformers One.desc': 'The untold origin story of Optimus Prime and Megatron — better known as sworn enemies, they were once close friends on Cybertron before a fateful choice changed their destinies forever.',

    // The Wild Robot
    'The Wild Robot': 'The Wild Robot',
    'The Wild Robot.desc': 'A robot named ROZZUM unit 7134 (Roz) is stranded on a wild island and must learn to adapt. She adopts an orphaned gosling and begins to discover what it means to be a mother.',

    // Venom
    'Venom: The Last Dance': 'Venom: The Last Dance',
    'Venom: The Last Dance.desc': 'Eddie Brock and Venom are on the run, pursued by both worlds — human and symbiote. They must make a devastating decision that will bring their story to its end.',

    // ── MOVIE LANGUAGES (EN) ──────────────────────────────────────────────────
    'Tiếng Anh': 'English',
    'Tiếng Việt': 'Vietnamese',
    'English with Vietnamese Subtitles': 'English with Vietnamese Subtitles',
    'Tiếng Anh kèm Phụ đề Tiếng Việt': 'English with Vietnamese Subtitles',
    'English': 'English',
    'Vietnamese': 'Vietnamese',
    'Korean': 'Korean',
    'Japanese': 'Japanese',
    'French': 'French',
    'Chinese': 'Chinese',
    'Tiếng Hàn': 'Korean',
    'Tiếng Nhật': 'Japanese',
    'Tiếng Pháp': 'French',
    'Tiếng Trung': 'Chinese',

    // Reviews
    'review.title': 'Reviews & Comments',
    'review.writeReview': 'Write a Review',
    'review.writeTitle': 'Write your review',
    'review.editTitle': 'Edit your review',
    'review.yourRating': 'Your rating',
    'review.yourComment': 'Comment',
    'review.commentPlaceholder': 'Share your thoughts about this movie...',
    'review.submitBtn': 'Submit Review',
    'review.updateBtn': 'Update',
    'review.cancelBtn': 'Cancel',
    'review.edit': 'Edit',
    'review.delete': 'Delete',
    'review.confirmDelete': 'Are you sure you want to delete this review?',
    'review.errorNoRating': 'Please select a star rating',
    'review.errorNoComment': 'Please enter a comment',
    'review.errorGeneral': 'An error occurred, please try again',
    'review.reviews': 'reviews',
    'review.noReviews': 'No reviews yet. Be the first to review this movie!',
    'review.loading': 'Loading reviews...',
    'review.loginPrompt': 'Log in to write a movie review',
    'review.adminNotice': 'Admin accounts cannot write reviews. Only regular users can review movies.',

    // Booking History Page (My Tickets)
    'history.title': 'Booking History',
    'history.subtitle': 'Review your booked tickets, food & drinks concessions, and transaction details.',
    'history.noBookings': 'You have not booked any tickets yet.',
    'history.findMovies': 'Find Movies',
    'history.payment.card': 'Credit / Debit Card',
    'history.payment.momo': 'MoMo Wallet',
    'history.payment.vnpay': 'VNPay Wallet',
    'history.status.paid': 'Paid',
    'history.status.pending': 'Pending',
    'history.status.refunded': 'Refunded',
    'history.unknownTime': 'Unknown Time',
    'history.noSeats': 'No seats selected',
    'history.totalPayment': 'Total Payment',
    'history.collapse': 'Collapse',
    'history.viewDetails': 'View Details',
    'history.selectedSeats': 'Selected Seats',
    'history.concessions': 'Concessions',
    'history.paymentMethod': 'Payment Method',
    'history.bookingId': 'Booking ID',
    'history.bookedAt': 'Booked at:',
    'history.total': 'Total',
    'history.unknownTheater': 'Unknown Theater',
    'history.unknownRoom': 'Unknown Screen',
    'history.movieDeleted': 'Movie deleted or no longer exists',

    // Promotions Page
    'promo.specialOffer': 'Special Offer',
    'promo.title': 'Exciting Promotions',
    'promo.subtitle': 'Grab deals, copy discount codes and enjoy the ultimate movie booking experience at the best price.',
    'promo.activeCodes': 'Active Codes',
    'promo.maxSavings': 'Max Savings',
    'promo.weeklyUpdate': 'Weekly Updates',
    'promo.allOffers': 'All Offers',
    'promo.howToUse': 'How to use promo code',
    'promo.step1': 'Select Movie',
    'promo.step1Desc': 'Browse the movie list and select the showtime you want.',
    'promo.step2': 'Select Seats',
    'promo.step2Desc': 'Select your favorite seats and add food & drinks concessions.',
    'promo.step3': 'Apply Code',
    'promo.step3Desc': 'Copy and paste the promo code into the field at checkout.',
    'promo.step4': 'Enjoy',
    'promo.step4Desc': 'Complete payment and enjoy the movie at a discounted price!',
    'promo.minOrderLabel': 'Min Order:',
    'promo.copied': 'Copied!',
    'countdown.days': 'days',
    'countdown.hours': 'hours',
    'countdown.minutes': 'mins',
    'countdown.seconds': 'secs',
    // Filters & Sorting
    'filter.nowShowing': 'Now Showing',
    'filter.comingSoon': 'Coming Soon',
    'filter.preview': 'Preview',
    'filter.preRelease': 'Pre-release',
    'filter.searchPlaceholder': 'Search movie title...',
    'filter.allGenres': 'All Genres',
    'filter.selectedGenres': 'selected',
    'filter.ratingAll': 'All Ratings',
    'filter.ratingAbove4.5': '4.5★ & above',
    'filter.ratingAbove4.0': '4.0★ & above',
    'filter.ratingAbove3.0': '3.0★ & above',
    'filter.sortBy': 'Sort by',
    'filter.sort.newest': 'Newest',
    'filter.sort.rating': 'Highest Rated',
    'filter.sort.durationAsc': 'Duration (Short to Long)',
    'filter.sort.durationDesc': 'Duration (Long to Short)',
    'filter.sort.titleAZ': 'Title (A-Z)',
    'filter.clearAll': 'Clear filters',
    'movies.title': 'Movie Catalog',
    'movies.subtitle': 'Browse the list of movies now showing or preview upcoming releases.',
    // Showtime filters & sorting
    'showtime.sortBy': 'Sort',
    'showtime.sort.earliest': 'Showtime (Earliest)',
    'showtime.sort.latest': 'Showtime (Latest)',
    'showtime.format': 'Format',
    'showtime.format.all': 'All',
    'showtime.started': 'Started',
    'showtime.alertPastShowtime': 'This showtime has already started or ended. Please choose another showtime.',
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('language') || 'vi';
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key) => {
    const langDict = translations[language] || translations['vi'];
    return langDict[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
