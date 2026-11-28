import { useEffect, useRef, useState, useCallback, type UIEvent } from "react";
import { useNavigate } from "react-router-dom";
import { IconBell, Skeleton } from "@systrol/ui";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "../../../api/notifications";
import styles from "./NotificationBell.module.css";

function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await fetchUnreadCount();
      setUnreadCount(res.unread_count);
    } catch {}
  }, []);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setPage(1);
    setHasMore(false);
    setIsLoadingMore(false);

    fetchNotifications({ page: 1 })
      .then((res) => {
        if (isMounted) {
          setNotifications(res.results);
          setHasMore(Boolean(res.next));
          const computedUnread = res.results.filter((n) => !n.is_read).length;
          setUnreadCount(computedUnread);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleScroll = (e: UIEvent<HTMLUListElement>) => {
    const target = e.currentTarget;
    if (
      hasMore &&
      !isLoadingMore &&
      target.scrollHeight - target.scrollTop - target.clientHeight < 40
    ) {
      loadMore();
    }
  };

  const loadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetchNotifications({ page: nextPage });
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const newItems = res.results.filter((n) => !existingIds.has(n.id));
        return [...prev, ...newItems];
      });
      setPage(nextPage);
      setHasMore(Boolean(res.next));
    } catch {
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.is_read) {
      try {
        await markNotificationRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {}
    }
    setIsOpen(false);
    if (item.action_url) {
      navigate(item.action_url);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  return (
    <div className={styles.bellWrapper} ref={wrapperRef} data-testid="notification-bell-wrapper">
      <button
        type="button"
        className={styles.bellButton}
        onClick={handleToggle}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        data-testid="notification-bell-button"
      >
        <IconBell size={14} color="currentColor" />
        {unreadCount > 0 && (
          <span className={styles.redDot} data-testid="notification-red-dot" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div
          className={styles.popover}
          role="dialog"
          aria-label="Notifications"
          data-testid="notification-popover"
        >
          <div className={styles.header}>
            <div className={styles.titleArea}>
              <h3 className={styles.title}>Notifications</h3>
              {unreadCount > 0 && (
                <span className={styles.unreadBadge}>{unreadCount} unread</span>
              )}
            </div>
            <button
              type="button"
              className={styles.markAllBtn}
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              data-testid="mark-all-read-button"
            >
              Mark all as read
            </button>
          </div>

          {isLoading ? (
            <div className={styles.skeletonList} data-testid="notification-skeleton-list">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className={styles.skeletonItem}>
                  <div className={styles.skeletonHeader}>
                    <Skeleton width="60%" height={14} />
                    <Skeleton width={40} height={10} />
                  </div>
                  <Skeleton width="90%" height={12} />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className={styles.emptyState}>No notifications</div>
          ) : (
            <ul
              className={styles.list}
              onScroll={handleScroll}
              data-testid="notification-list"
            >
              {notifications.map((item) => (
                <li
                  key={item.id}
                  className={`${styles.item} ${!item.is_read ? styles.itemUnread : ""}`}
                  onClick={() => handleItemClick(item)}
                  data-testid={`notification-item-${item.id}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleItemClick(item);
                    }
                  }}
                >
                  <div className={styles.itemHeader}>
                    <span className={styles.itemTitle}>{item.title}</span>
                    <span className={styles.itemTime}>{formatTimeAgo(item.created_at)}</span>
                  </div>
                  <p className={styles.itemBody}>{item.body}</p>
                </li>
              ))}
              {isLoadingMore && (
                <li
                  className={styles.skeletonMore}
                  data-testid="notification-skeleton-more"
                >
                  <div className={styles.skeletonItem}>
                    <div className={styles.skeletonHeader}>
                      <Skeleton width="55%" height={14} />
                      <Skeleton width={35} height={10} />
                    </div>
                    <Skeleton width="85%" height={12} />
                  </div>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
