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

    // Movie descriptions & titles (VI)
    'Avengers: Secret Wars': 'Avengers: Secret Wars',
    'Avengers: Secret Wars.desc': 'Sau các sự kiện của Endgame, các anh hùng Marvel đối mặt với mối đe dọa lớn nhất từ trước đến nay khi các thực tại song song va chạm, buộc họ phải liên minh với những phiên bản khác của chính mình.',
    
    'Minecraft: The Movie': 'Minecraft: The Movie',
    'Minecraft: The Movie.desc': 'Bốn người lạ mặt và một thú mỏ vịt bất ngờ bị hút vào thế giới Minecraft đầy khối vuông và nguy hiểm. Họ phải học cách sinh tồn và tìm đường về nhà.',

    'Thunderbolts*': 'Thunderbolts*',
    'Thunderbolts*.desc': 'Một nhóm các nhân vật phản diện và anh hùng sa ngã của Marvel được tập hợp lại để thực hiện nhiệm vụ tối mật. Khi mọi thứ sụp đổ, họ phải lựa chọn giữa sứ mệnh và lương tâm.',

    'Lilo & Stitch': 'Lilo & Stitch',
    'Lilo & Stitch.desc': 'Phiên bản live-action của bộ phim hoạt hình kinh điển Disney. Lilo, một cô bé Hawaii cô đơn, kết bạn với một sinh vật ngoài hành tinh tên Stitch và cùng nhau học về ý nghĩa của gia đình.',

    'Tôi Thấy Hoa Vàng Trên Cỏ Xanh 2': 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh 2',
    'Tôi Thấy Hoa Vàng Trên Cỏ Xanh 2.desc': 'Tiếp nối câu chuyện tuổi thơ đong đầy cảm xúc, hai anh em Thiều và Tường trưởng thành hơn trong hành trình tìm kiếm bản thân giữa vùng quê yên bình miền Trung.',

    'Superman: Legacy': 'Superman: Legacy',
    'Superman: Legacy.desc': 'James Gunn tái khởi động vũ trụ DC với câu chuyện về Superman trẻ tuổi Clark Kent, người đang cố gắng cân bằng di sản Krypton và cuộc sống con người trên Trái Đất.',

    'Jurassic World: Rebirth': 'Jurassic World: Rebirth',
    'Jurassic World: Rebirth.desc': 'Năm năm sau thảm họa toàn cầu, ba nhóm người sống sót phải hợp tác để truy tìm mẫu ADN khủng long quý giá có thể cứu nhân loại. Nhưng những loài ăn thịt nguyên thủy nhất đang chờ đợi họ.',

    'Cám': 'Cám',
    'Cám.desc': 'Phiên bản kinh dị Việt Nam của câu chuyện cổ tích Tấm Cám. Cám xinh đẹp nhưng độc ác sẵn sàng làm mọi thứ để giành được cuộc sống mà mình ao ước, kể cả những điều không thể tưởng tượng.',

    'Dune: Part Two': 'Dune: Phần Hai',
    'Dune: Part Two.desc': 'Paul Atreides liên minh với người Fremen và thực hiện hành trình báo thù những kẻ âm mưu hủy diệt gia đình mình. Khi anh phải lựa chọn giữa tình yêu và định mệnh của vũ trụ.',

    'Kung Fu Panda 4': 'Kung Fu Panda 4',
    'Kung Fu Panda 4.desc': 'Po được bổ nhiệm làm Lãnh đạo Tinh thần của Thung lũng Hòa bình, nhưng trước tiên phải tìm và đào tạo một Chiến binh Rồng mới. Hành trình đưa anh đến một thành phố ven biển nguy hiểm.',

    // Movie Languages (VI)
    'Tiếng Anh': 'Tiếng Anh',
    'Tiếng Việt': 'Tiếng Việt',
    'English with Vietnamese Subtitles': 'Tiếng Anh kèm Phụ đề Tiếng Việt',
    'Tiếng Anh kèm Phụ đề Tiếng Việt': 'Tiếng Anh kèm Phụ đề Tiếng Việt',
    'English': 'Tiếng Anh',
    'Vietnamese': 'Tiếng Việt',
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

    // Movie descriptions & titles (EN)
    'Avengers: Secret Wars': 'Avengers: Secret Wars',
    'Avengers: Secret Wars.desc': 'Following the events of Endgame, the Marvel heroes face their greatest threat yet as parallel realities collide, forcing them to ally with alternate versions of themselves.',
    
    'Minecraft: The Movie': 'Minecraft: The Movie',
    'Minecraft: The Movie.desc': 'Four misfits and a platypus find themselves pulled into the cubical and perilous world of Minecraft. They must learn to survive and find their way home.',

    'Thunderbolts*': 'Thunderbolts*',
    'Thunderbolts*.desc': 'A group of reformed villains and fallen heroes from Marvel are assembled for a top-secret mission. When everything crumbles, they must choose between their directive and their conscience.',

    'Lilo & Stitch': 'Lilo & Stitch',
    'Lilo & Stitch.desc': 'Live-action adaptation of the classic Disney animated film. Lilo, a lonely Hawaiian girl, befriends an alien creature named Stitch, and together they learn the meaning of family.',

    'Tôi Thấy Hoa Vàng Trên Cỏ Xanh 2': 'Yellow Flowers on the Green Grass 2',
    'Tôi Thấy Hoa Vàng Trên Cỏ Xanh 2.desc': 'Continuing the emotional childhood story, brothers Thieu and Tuong grow older in their journey to find themselves amidst the peaceful countryside of Central Vietnam.',

    'Superman: Legacy': 'Superman: Legacy',
    'Superman: Legacy.desc': 'James Gunn reboots the DC Universe with the story of a young Superman, Clark Kent, as he strives to balance his Kryptonian heritage with his human upbringing on Earth.',

    'Jurassic World: Rebirth': 'Jurassic World: Rebirth',
    'Jurassic World: Rebirth.desc': 'Five years after a global disaster, three groups of survivors must cooperate to retrieve a precious dinosaur DNA sample that could save humanity. But the most primal carnivores await them.',

    'Cám': 'Cam: The Dark Tale',
    'Cám.desc': 'A Vietnamese horror adaptation of the classic fairy tale Tam Cam. Cam, beautiful but cruel, is willing to do whatever it takes to win the life she desires, including the unthinkable.',

    'Dune: Part Two': 'Dune: Part Two',
    'Dune: Part Two.desc': 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.',

    'Kung Fu Panda 4': 'Kung Fu Panda 4',
    'Kung Fu Panda 4.desc': 'Po is tapped to become the Spiritual Leader of the Valley of Peace, but must first find and train a new Dragon Warrior. The journey takes him to a dangerous coastal city.',

    // Movie Languages (EN)
    'Tiếng Anh': 'English',
    'Tiếng Việt': 'Vietnamese',
    'English with Vietnamese Subtitles': 'English with Vietnamese Subtitles',
    'Tiếng Anh kèm Phụ đề Tiếng Việt': 'English with Vietnamese Subtitles',
    'English': 'English',
    'Vietnamese': 'Vietnamese',
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
