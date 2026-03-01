import SwiftUI

struct EventRowView: View {
    let event: WatchEvent
    let isActive: Bool
    
    var body: some View {
        HStack(spacing: 8) {
            Rectangle()
                .fill(isActive ? Color(red: 0.66, green: 0.69, blue: 0.83) : Color.clear)
                .frame(width: 3)
                .cornerRadius(2)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(event.time)
                    .font(isActive ? .headline : .caption)
                    .foregroundColor(isActive ? Color(red: 0.66, green: 0.69, blue: 0.83) : .gray)
                    .fontWeight(isActive ? .light : .regular)
                
                Text(event.title)
                    .font(.caption)
                    .foregroundColor(isActive ? .white : .gray)
                    .fontWeight(isActive ? .medium : .regular)
                
                if isActive {
                    Text("AHORA")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(Color(red: 0.66, green: 0.69, blue: 0.83))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color(red: 0.66, green: 0.69, blue: 0.83).opacity(0.15))
                        .cornerRadius(4)
                }
            }
            
            Spacer()
        }
        .padding(.vertical, 2)
        .listRowBackground(isActive ? Color(red: 0.15, green: 0.16, blue: 0.21) : Color.clear)
    }
}
