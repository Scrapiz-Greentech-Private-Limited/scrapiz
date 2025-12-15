from django.urls import path
from .views.user import  RegisterView, LoginView, LogoutView, PasswordResetView, PasswordResetRequestView, ResendotpView, UserView,ReferredUsersView , ReferralTransactionsView,RedeemReferralBalanceView, AuditLogView
from .views.oauth import GoogleOAuthLoginView, AppleOAuthLoginView, AppleOAuthConfirmLinkView

urlpatterns = [
    path('register/',RegisterView.as_view()),
    path('resendotp/',ResendotpView.as_view()),
    path('login/',LoginView.as_view()),
    path('user/',UserView.as_view()),
    path('logout/',LogoutView.as_view()),
    path('password-reset-request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/', PasswordResetView.as_view(), name='password-reset'),
    path('google-login/', GoogleOAuthLoginView.as_view(), name='google-login'),
    path('apple-login/', AppleOAuthLoginView.as_view(), name='apple-login'),
    path('apple-login/confirm-link/', AppleOAuthConfirmLinkView.as_view(), name='apple-login-confirm'),
    path('referrals/users/', ReferredUsersView.as_view(), name='referred-users'),
    path('referrals/transactions/', ReferralTransactionsView.as_view(), name='referral-transactions'),
    path('referrals/redeem/', RedeemReferralBalanceView.as_view(), name='redeem-referral-balance'),
    path('audit-logs/', AuditLogView.as_view(), name='audit-logs'),
]
